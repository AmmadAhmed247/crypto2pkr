import { Provider, Contract } from "zksync-ethers";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import Transaction from "../models/TransactionSchema.js";
import vaultABI from "../utils/abi.json" with { type: "json" };
import { simulatedBankPayout } from "../utils/payout.js";


const POLL_INTERVAL_MS  = 5_000; 
const BLOCK_CHUNK_SIZE  = 500;     
const STATE_FILE = path.resolve("./relay-state.json");
const provider = new Provider("https://sepolia.era.zksync.dev");
const contract  = new Contract(process.env.CONTRACT_ADDRESS, vaultABI.abi, provider);


function loadLastBlock(fallback) {
    try {
        const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
        const block = parseInt(data.lastBlock, 10);
        console.log(`Resuming from saved block: ${block}`);
        return isNaN(block) ? fallback : block;
    } catch {
        console.log(`No saved state found — starting from block ${fallback}`);
        return fallback;
    }
}

function saveLastBlock(block) {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify({ lastBlock: block }), "utf8");
    } catch (err) {
        console.error("Failed to save lastBlock state:", err.message);
    }
}


const buildTxDoc = (user, requestId, token, amount, raastId, txHash) => ({
    userAddress:  user.toLowerCase(),
    requestId:    requestId.toString(),
    lockTxHash:   txHash,
    raastId:      raastId,
    lockedAmount: ethers.formatEther(amount),
    tokenSymbol:  token === ethers.ZeroAddress ? "ETH" : "ERC20",
    status:       "LOCKED",
});


async function handleLockInitiated(event) {
    const [user, requestId, token, amount, raastId] = event.args;
    const txHash = event.transactionHash;

    console.log(`[LockInitiated] tx=${txHash} | user=${user} | requestId=${requestId}`);

    try {
        const exists = await Transaction.findOne({ lockTxHash: txHash });
        if (!exists) {
            await Transaction.create(buildTxDoc(user, requestId, token, amount, raastId, txHash));
            console.log(`  → Saved to DB, triggering bank payout...`);
            await simulatedBankPayout(user, requestId.toString(), txHash);
        } else {
            console.log(`  → Already in DB, skipping.`);
        }
    } catch (err) {
        console.error(`  → DB Error (LockInitiated): ${err.message}`);
    }
}

async function handlePayoutConfirmed(event) {
    const [user, requestId, _token, _amount] = event.args;
    const txHash = event.transactionHash;

    console.log(`[PayoutConfirmed] tx=${txHash} | user=${user} | requestId=${requestId}`);

    try {
        const result = await Transaction.findOneAndUpdate(
            { userAddress: user.toLowerCase(), requestId: requestId.toString() },
            { status: "PAID", payoutTxHash: txHash },
            { new: true }
        );

        if (result) {
            console.log(`  → DB updated to PAID.`);
        } else {
            console.warn(`  → No matching TX found in DB for user=${user} requestId=${requestId}`);
        }
    } catch (err) {
        console.error(`  → DB Error (PayoutConfirmed): ${err.message}`);
    }
}


async function pollEvents(lastBlockRef) {
    try {
        const currentBlock = await provider.getBlockNumber();

        if (currentBlock <= lastBlockRef.value) return;

        let from = lastBlockRef.value + 1;

        while (from <= currentBlock) {
            const to = Math.min(from + BLOCK_CHUNK_SIZE - 1, currentBlock);

            console.log(`Polling blocks ${from} → ${to}...`);
            const [lockEvents, confirmEvents] = await Promise.all([
                contract.queryFilter(contract.filters.LockInitiated(),   from, to),
                contract.queryFilter(contract.filters.PayoutConfirmed(), from, to),
            ]);

            const allEvents = [...lockEvents, ...confirmEvents]
                .sort((a, b) => a.blockNumber - b.blockNumber || a.index - b.index);

            for (const event of allEvents) {
                if (event.fragment?.name === "LockInitiated")   await handleLockInitiated(event);
                if (event.fragment?.name === "PayoutConfirmed") await handlePayoutConfirmed(event);
            }

            from = to + 1;
        }

        lastBlockRef.value = currentBlock;
        saveLastBlock(currentBlock);

    } catch (err) {
        console.error(`Poll error (will retry in ${POLL_INTERVAL_MS / 1000}s):`, err.message);
    }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export const startEventListeners = async () => {
    console.log("═══════════════════════════════════════");
    console.log("  PakFlow Relay Watcher Starting...");
    console.log("═══════════════════════════════════════");

    const currentBlock = await provider.getBlockNumber();

    const lastBlockRef = {
        value: loadLastBlock(currentBlock - 1000),
    };

    console.log(`Current chain head: ${currentBlock}`);
    console.log(`Will sync from block: ${lastBlockRef.value}`);

    await pollEvents(lastBlockRef);

    const interval = setInterval(() => pollEvents(lastBlockRef), POLL_INTERVAL_MS);

    process.on("SIGINT",  () => { clearInterval(interval); console.log("\nWatcher stopped."); process.exit(0); });
    process.on("SIGTERM", () => { clearInterval(interval); console.log("\nWatcher stopped."); process.exit(0); });

    console.log(`Polling every ${POLL_INTERVAL_MS / 1000}s. Watcher is live.`);
};