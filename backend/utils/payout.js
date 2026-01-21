import { Wallet, Provider, Contract } from "zksync-ethers";
import { ethers } from "ethers";
import TransactionModel from "../models/TransactionScheema.js";
import vaultABI from "../utils/abi.json" with { type: "json" };

const provider = new Provider("https://sepolia.era.zksync.dev");
const adminWallet = process.env.ADMIN_Wallet_KEY;
const wallet = new Wallet(adminWallet, provider);
const contract = new Contract(process.env.CONTRACT_ADDRESS, vaultABI.abi, wallet);

export const simulatedBankPayout = async (userAddress, tokenAddress, txHash, raastId) => {

    await new Promise(resolve => setTimeout(resolve, 10000));
    
    try {
        console.log(`Checking pending withdrawal for user: ${userAddress}`);
        const withdrawal = await contract.getPendingWithdrawals(userAddress);
        const amount = withdrawal[0];
        const returnedRaastId = withdrawal[1];
        const isProcessed = withdrawal[2];
        
        console.log(`Withdrawal Details:`, {
            amount: amount.toString(),
            raastId: returnedRaastId,
            isProcessed
        });

        if (isProcessed || amount == 0n) {
            console.log(`Skip: No active payout for ${userAddress}`);
            return;
        }
        
        console.log(`PKR sent via RAAST --- Releasing Crypto to Treasury`);
        
        const tx = await contract.confirmPayout(userAddress);
        console.log(`Payout transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`Payout transaction confirmed: ${receipt.hash}`);
        
        await TransactionModel.findOneAndUpdate(
            { lockTxHash: txHash },
            { 
                status: "PAID",
                payoutTxHash: receipt.hash
            }
        );
        
        console.log(`Payout successful for user: ${userAddress}`);
        
    } catch (error) {
        console.error(`Payout failed for ${userAddress}:`, error.message);
        console.error("Full error:", error);
        
        // Update database with failed status
        try {
            await TransactionModel.findOneAndUpdate(
                { lockTxHash: txHash },
                { 
                    status: "FAILED",
                    errorMessage: error.message
                }
            );
        } catch (dbError) {
            console.error("Database update failed:", dbError.message);
        }
    }
};