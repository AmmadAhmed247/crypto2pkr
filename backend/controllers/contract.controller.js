import { Wallet, Provider, Contract } from "zksync-ethers";
import { ethers } from "ethers";
import TransactionSchema from "../models/TransactionSchema.js";
import vaultAbi from "../utils/abi.json" with { type: "json" };

const provider = new Provider("https://sepolia.era.zksync.dev");

const wallet   = new Wallet(process.env.ADMIN_WALLET_KEY, provider);
const contract = new Contract(process.env.CONTRACT_ADDRESS, vaultAbi.abi, wallet);

export const confirmOnChainPayout = async (userAddress, requestId) => {
    try {
        console.log(`Confirming on-chain payout | User: ${userAddress} | RequestID: ${requestId}`);
        const tx= await contract.confirmPayout(userAddress, requestId);
        const receipt =await tx.wait();
        console.log(`On-chain payout confirmed | TX: ${receipt.hash}`);
        return receipt.hash;
    } catch (error) {
        console.error(`Relay server error: ${error.message}`);
        throw error;
    }
};

export const getPendingWithdrawals = async (req, res) => {
    try {
        const { userAddress } = req.body;
        if (!userAddress) {
            return res.status(400).json({ error: "userAddress is required" });
        }
        const addr = userAddress.toLowerCase();
        const counter = await contract.userRequestCounter(addr);
        console.log(`counter...${counter}`);

        if (counter === 0n) {
            return res.status(200).json({ isPending: false, timestamp: null });
        }
        const latestId   = counter - 1n;
        const withdrawal = await contract.withdrawals(addr, latestId); // like address ~ or uski id se ~ se complete data ..
        const isPending = withdrawal.amount > 0n && !withdrawal.isProcessed;
        return res.status(200).json({
            isPending,
            requestId:   latestId.toString(),
            amount:      ethers.formatEther(withdrawal.amount),
            raastId:     withdrawal.raastId,
            isProcessed: withdrawal.isProcessed,
            timestamp:   withdrawal.timestamp ? Number(withdrawal.timestamp) : null,
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const checkTxStatus = async (req, res) => {
    try {
        const { txHash } = req.params;
        const tx = await TransactionSchema.findOne({ lockTxHash: txHash });
        if (!tx) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        res.status(200).json({ status: tx.status, data: tx });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};