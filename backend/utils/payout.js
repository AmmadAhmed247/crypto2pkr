import { Wallet, Provider, Contract } from "zksync-ethers";
import TransactionModel from "../models/TransactionSchema.js";
import vaultABI from "../utils/abi.json" with { type: "json" };

const provider = new Provider("https://sepolia.era.zksync.dev");
const wallet= new Wallet(process.env.ADMIN_WALLET_KEY, provider);
console.log("Wallet address:", wallet.address);
const contract = new Contract(process.env.CONTRACT_ADDRESS, vaultABI.abi, wallet);
const PAYOUT_DELAY_MS = 10_000; 

export const simulatedBankPayout = async (userAddress, requestId, txHash) => {
    console.log(`Payout queued | User: ${userAddress} | RequestID: ${requestId}`);

    await new Promise(resolve => setTimeout(resolve, PAYOUT_DELAY_MS));

    try {
        console.log(`Processing Payout | User: ${userAddress} | RequestID: ${requestId}`);

        const withdrawal = await contract.withdrawals(userAddress, requestId);

        if (!withdrawal || withdrawal.amount === 0n || withdrawal.isProcessed) {
            console.log(`Skipping: already processed or invalid | RequestID: ${requestId}`);
            return;
        }
        const tx= await contract.confirmPayout(userAddress, requestId);
        console.log(`Relay Tx Sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`Relay Tx Confirmed: ${receipt.hash}`);

  
        await TransactionModel.findOneAndUpdate(
            { lockTxHash: txHash },
            { status: "PAID", payoutTxHash: receipt.hash }
        );

        console.log(` Bridge completed for ${userAddress} | RequestID: ${requestId}`);

    } catch (error) {
        console.error(`Payout Failed | RequestID: ${requestId} | Error: ${error.message}`);

        await TransactionModel.findOneAndUpdate(
            { lockTxHash: txHash },
            { status: "FAILED", errorMessage: error.message }
        );
    }
};