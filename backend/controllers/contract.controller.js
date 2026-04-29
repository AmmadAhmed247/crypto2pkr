import { Wallet, Provider, Contract } from "zksync-ethers";
import { ethers } from "ethers";
import TransactionSchema from "../models/TransactionSchema.js";
import vaultAbi from "../utils/abi.json" with { type: "json" };

const provider = new Provider("https://sepolia.era.zksync.dev");

const wallet = new Wallet(process.env.ADMIN_WALLET_KEY, provider);
const contract = new Contract(process.env.CONTRACT_ADDRESS, vaultAbi.abi, wallet);

export const confirmOnChainPayout = async (req, res) => {
  try {
    const { userAddress, requestId } = req.body;
    if (!userAddress || !requestId) {
      return res.status(400).json({
        success: false,
        error: "userAddress and requestId are required",
      });
    }
    if (req.headers["x-admin-key"] !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }
    const normalizedAddress = userAddress.toLowerCase();
    const existing = await TransactionSchema.findOne({
      userAddress: normalizedAddress,
      requestId: requestId.toString(),
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }
    if (existing.status === "PAID") {
      return res.status(400).json({
        success: false,
        error: "Already paid",
      });
    }
    const withdrawal = await contract.withdrawals(normalizedAddress, requestId);
    if (withdrawal.isProcessed) {
      return res.status(400).json({
        success: false,
        error: "Already processed on-chain",
      });
    }
    console.log(`Confirming payout | ${normalizedAddress} | ${requestId}`);
    const tx = await contract.confirmPayout(normalizedAddress, requestId);

    const receipt = await Promise.race([
      tx.wait(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 20000)
      ),
    ]);

    await TransactionSchema.findOneAndUpdate(
      {
        userAddress: normalizedAddress,
        requestId: requestId.toString(),
      },
      {
        status: "PAID",
        payoutTxHash: receipt.hash,
      }
    );

    return res.status(200).json({
      success: true,
      txHash: receipt.hash,
    });

  } catch (error) {
    console.error("Relay error:", error.message);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
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
        const latestId = counter - 1n;
        const withdrawal = await contract.withdrawals(addr, latestId); // like address ~ or uski id se ~ se complete data ..
        const isPending = withdrawal.amount > 0n && !withdrawal.isProcessed;
        return res.status(200).json({
            isPending,
            requestId: latestId.toString(),
            amount: ethers.formatEther(withdrawal.amount),
            raastId: withdrawal.raastId,
            isProcessed: withdrawal.isProcessed,
            timestamp: withdrawal.timestamp ? Number(withdrawal.timestamp) : null,
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