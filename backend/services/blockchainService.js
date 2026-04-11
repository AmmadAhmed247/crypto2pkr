import { Provider, Contract } from "zksync-ethers";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import Transaction from "../models/TransactionSchema.js";
import vaultABI from "../utils/abi.json" with { type: "json" };
import { simulatedBankPayout } from "../utils/payout.js";
import axios from "axios"

const POLL_INTERVAL_MS  = 5_000; 
const BLOCK_CHUNK_SIZE  = 500;     
const STATE_FILE=path.resolve("./relay-state.json");
const provider = new Provider("https://sepolia.era.zksync.dev");
const contract  = new Contract(process.env.CONTRACT_ADDRESS, vaultABI.abi, provider);

const usdToPkr=process.env.PKR_RATE;


function loadLastBlock(fallback){
    try {
        const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
        const block = parseInt(data.lastBlock, 10);

        console.log(`Resuming from saved block: ${block}`);
        return Number.isFinite(block) ? block : fallback;

    } catch (error) {
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


async function getPriceFromBinance(tokenSymbol) {
    try {
        const symbol = tokenSymbol.toUpperCase() === "ETH" ? "ETHUSDT" : `${tokenSymbol.toUpperCase()}USDT`;
        const { data } = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        return parseFloat(data.price);
    } catch (err) {
        console.error("Binance Price Fetch Error:", err.message);
        return 2500; 
    }
}

const buildTxDoc = (user, requestId, token, amount, raastId, txHash , pkrAmount) => ({
    userAddress:  user.toLowerCase(),
    requestId:    requestId.toString(),
    lockTxHash:   txHash,
    raastId:      raastId,
    lockedAmount: ethers.formatEther(amount),
    tokenSymbol:  token === ethers.ZeroAddress ? "ETH" : "ERC20",
    status:"LOCKED",
    type:"BRIDGE",
    pkrAmount:pkrAmount
});

// becasue right now i am only using eth and usdc or usdt so (6 decimal for that)..

function formatTokenAmount(amount, token) {
    if (token === ethers.ZeroAddress) {
        return ethers.formatEther(amount); 
    }
    return ethers.formatUnits(amount, 6); 
}





function getTokenSymbol(token) {
    if (token === ethers.ZeroAddress) return "ETH";
    if (token.toLowerCase() === process.env.USDC_ADDRESS?.toLowerCase()) return "USDC";
    if (token.toLowerCase() === process.env.USDT_ADDRESS?.toLowerCase()) return "USDT";
    return "ERC20";
}

async function handleLockInitiated(event) {
    const [user, requestId, token, amount, raastId] = event.args;
    const txHash = event.transactionHash;
    const tokenSymbol = getTokenSymbol(token);
    const formattedAmount = formatTokenAmount(amount, token);
    let pkrAmount;
    if (tokenSymbol === "USDC" || tokenSymbol === "USDT") {
        pkrAmount = (parseFloat(formattedAmount) * usdToPkr).toFixed(2);
    } else {
        const cryptoPriceInUsd = await getPriceFromBinance("ETH"); 
        pkrAmount = (parseFloat(formattedAmount) * cryptoPriceInUsd * usdToPkr).toFixed(2);
    }

    console.log(`[LockInitiated] tx=${txHash} | user=${user} | token=${tokenSymbol} | amount=${formattedAmount} | pkr=${pkrAmount}`);

    try {
        const exists = await Transaction.findOne({ lockTxHash: txHash });
        if (!exists) {
            await Transaction.create({
                userAddress:  user.toLowerCase(),
                requestId:    requestId.toString(),
                lockTxHash:   txHash,
                raastId:      raastId,
                lockedAmount: formattedAmount, 
                tokenSymbol:  tokenSymbol,     
                status:       "LOCKED",
                type:         "BRIDGE",
                pkrAmount:    pkrAmount
            });
            console.log(`Saved to DB | ${tokenSymbol} ${formattedAmount} → ${pkrAmount} PKR`);
            await simulatedBankPayout(user, requestId.toString(), txHash);
        } else {
            console.log(`Already in DB, skipping.`);
        }
    } catch (err) {
        console.error(`DB Error (LockInitiated): ${err.message}`);
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
            console.log(`DB updated to PAID.`);
        } else {
            console.warn(`No matching TX found in DB for user=${user} requestId=${requestId}`);
        }
    } catch (err) {
        console.error(` DB Error (PayoutConfirmed): ${err.message}`);
    }
}

async function handleClaim(event) {
    const [user, requestId, _token, _amount] = event.args;
    const txHash = event.transactionHash;
    console.log(`[RefundClaimed] tx=${txHash} | user=${user} | requestId=${requestId}`);
    try {
        const result = await Transaction.findOneAndUpdate(
            { userAddress: user.toLowerCase(), requestId: requestId.toString() }, 
            { status: "CLAIMED", claimTxHash: txHash },                           
            { new: true }
        );
        if (result) {
            console.log(`DB updated to CLAIMED.`);
        } else {
            console.warn(`No matching TX found in DB for user=${user} requestId=${requestId}`);
        }
    } catch (error) {
        console.error(`DB Error (Claimed): ${error.message}`);
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

            const [lockEvents, confirmEvents, claimEvents] = await Promise.all([
                contract.queryFilter(contract.filters.LockInitiated(),   from, to),
                contract.queryFilter(contract.filters.PayoutConfirmed(), from, to),
                contract.queryFilter(contract.filters.RefundClaimed(),   from, to), 
            ]);

            const allEvents = [...lockEvents, ...confirmEvents, ...claimEvents] 
                .sort((a, b) => a.blockNumber - b.blockNumber || a.index - b.index);

            for (const event of allEvents) {
                if (event.fragment?.name === "LockInitiated")   await handleLockInitiated(event);
                if (event.fragment?.name === "PayoutConfirmed") await handlePayoutConfirmed(event);
                if (event.fragment?.name === "RefundClaimed")   await handleClaim(event);
            }

            from = to + 1;
        }

        lastBlockRef.value = currentBlock;
        saveLastBlock(currentBlock);

    } catch (err) {
        console.error(`Poll error (will retry in ${POLL_INTERVAL_MS / 1000}s):`, err.message);
    }
}


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