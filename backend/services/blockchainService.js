import { Provider, Contract } from "zksync-ethers"
import Transaction from "../models/TransactionScheema.js";
import { ethers } from "ethers"
import vaultABI from "../utils/abi.json" with { type: "json" };
import { simulatedBankPayout } from "../utils/payout.js";

const contractAddress = process.env.CONTRACT_ADDRESS;
const URL = "https://sepolia.era.zksync.dev"

const provider = new Provider(URL);
provider.pollingInterval = 4000; 

const contract = new Contract(contractAddress, vaultABI.abi, provider);

export const startEventListeneres = async () => {
    console.log("Watcher Starting....");

    // 1. Historical Sync Logic
    const syncMissingEvents = async () => {
        try {
            const currentBlock = await provider.getBlockNumber();
            const startBlock = currentBlock - 1000;
            console.log(`Scanning Block From ~ ${startBlock} to ~ ${currentBlock}..`);
            
            const lockEvents = await contract.queryFilter("LockInitiated", startBlock, currentBlock);
            
            for (const event of lockEvents) {
                const { user, token, amount, raastId } = event.args;
                const txHash = event.transactionHash;
                
                const exists = await Transaction.findOne({ lockTxHash: txHash });
                if (!exists) {
                    await Transaction.create({
                        userAddress: user.toLowerCase(),
                        lockTxHash: txHash,
                        raastId: raastId,
                        lockedAmount: ethers.formatEther(amount),
                        tokenSymbol: token,
                        status: "LOCKED"
                    });
                    console.log(`Missing LOCK ~ Found -- ${txHash}`);
                }
            }
        } catch (error) {
            console.error("Sync Error:", error.message);
        }
    };

    await syncMissingEvents();

    // 2. Live Listener Setup
    const setupListeners = () => {
        contract.removeAllListeners();

        contract.on("LockInitiated", async (user, token, amount, raastId, timestamp, event) => {
            console.log(`NEW USER: ${user}`);
            try {
                const txHash = event.log.transactionHash;
                const exists = await Transaction.findOne({ lockTxHash: txHash });
                
                if (!exists) {
                    await Transaction.create({
                        userAddress: user.toLowerCase(),
                        lockTxHash: txHash,
                        raastId: raastId,
                        lockedAmount: ethers.formatEther(amount),
                        tokenSymbol: token,
                        status: "LOCKED"
                    });
                    console.log("Transaction Saved ~ ");
                    
                    // Pass raastId to payout function
                    simulatedBankPayout(user, token, txHash, raastId);
                }
            } catch (error) {
                console.error(`DB error: ${error.message}`);
            }
        });

        contract.on("PayoutConfirmed", async (user, token, amount, event) => {
            console.log(`Payout Confirmed: ${user}`);
            try {
                await Transaction.findOneAndUpdate(
                    { userAddress: user.toLowerCase(), status: "LOCKED" },
                    { 
                        status: "PAID", 
                        payoutTxHash: event.log.transactionHash 
                    },
                    { sort: { createdAt: -1 } }
                );
                console.log(`CONFIRM PAYOUT ~ ${event.log.transactionHash}`);
            } catch (error) {
                console.error("Error while updating the payouts:", error.message);
            }
        });

        console.log("Listening for Live Events...");
    };

    setupListeners();

    provider.on("error", (error) => {
        console.error("Provider Error! Restarting listeners...", error.message);
        setTimeout(setupListeners, 5000);
    });
};