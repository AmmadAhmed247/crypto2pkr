import { Provider, Contract } from "zksync-ethers";
import { ethers } from "ethers";
import Transaction from "../models/TransactionSchema.js";
import vaultABI from "../utils/abi.json" with { type: "json" };
import { simulatedBankPayout } from "../utils/payout.js";

const provider = new Provider("https://sepolia.era.zksync.dev");
const contract  = new Contract(process.env.CONTRACT_ADDRESS, vaultABI.abi, provider);



const buildTxDoc = (user, requestId, token, amount, raastId, txHash) => ({
    userAddress:  user.toLowerCase(),
    requestId:    requestId.toString(),
    lockTxHash:   txHash,
    raastId:      raastId,
    lockedAmount: ethers.formatEther(amount),
    tokenSymbol:  token === ethers.ZeroAddress ? "ETH" : "ERC20",
    status:       "LOCKED",
});

export const startEventListeners = async () => {
    console.log("Watcher Starting...");

    const syncMissingEvents = async () => {
        try {
            const currentBlock = await provider.getBlockNumber();
            const startBlock   = currentBlock - 1000;
            const lockEvents = await contract.queryFilter("LockInitiated", startBlock, currentBlock);
            for (const event of lockEvents) {
                const [user, requestId, token, amount, raastId, _timestamp] = event.args;
                const txHash = event.transactionHash;
                const exists = await Transaction.findOne({ lockTxHash: txHash });
                if (!exists) {
                    await Transaction.create(buildTxDoc(user, requestId, token, amount, raastId, txHash));
                    console.log(`Synced missing transaction: ${txHash}`);
                    simulatedBankPayout(user, requestId.toString(), txHash);
                }
            }
        } catch (error) {
            console.error("Sync Error:", error.message);
        }
    };


    const setupListeners = () => {
        contract.removeAllListeners();
        contract.on("LockInitiated", async (user, requestId, token, amount, raastId, _timestamp, event) => {
            const txHash = event.log.transactionHash;
            console.log(`New Lock Detected: ${txHash} (RequestID: ${requestId})`);
            try {
                const exists = await Transaction.findOne({ lockTxHash: txHash });
                if (!exists) {
                    await Transaction.create(buildTxDoc(user, requestId, token, amount, raastId, txHash));
                    simulatedBankPayout(user, requestId.toString(), txHash);
                }
            } catch (err) {
                console.error("Event Processing Error:", err.message);
            }
        });

        contract.on("PayoutConfirmed", async (user, requestId, _token, _amount, event) => {
            try {
                await Transaction.findOneAndUpdate(
                    { userAddress: user.toLowerCase(), requestId: requestId.toString() },
                    { status: "PAID", payoutTxHash: event.log.transactionHash }
                );
                console.log(`On-chain Confirmation | User: ${user} | RequestID: ${requestId}`);
            } catch (err) {
                console.error("PayoutConfirmed Sync Error:", err.message);
            }
        });

        console.log("Real-time event listeners active.");
    };

    await syncMissingEvents();
    setupListeners();

    provider.on("error", (error) => {
        console.error("Provider Error. Reconnecting in 5s...", error.message);
        setTimeout(setupListeners, 5000);
    });
};