

import "dotenv/config";
import mongoose from "mongoose";
import { Wallet, Provider, Contract } from "zksync-ethers";
import TransactionModel from "./models/TransactionSchema.js";
import vaultABI from "./utils/abi.json" with { type: "json" };
import { simulatedBankPayout } from "./utils/payout.js";
import fs from "fs";

const provider= new Provider("https://sepolia.era.zksync.dev");
const wallet= new Wallet(process.env.ADMIN_WALLET_KEY, provider);
const contract=new Contract(process.env.CONTRACT_ADDRESS, vaultABI.abi, wallet);

async function recover() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB connected");

    const { ethers } = await import("ethers");
    const balance = await provider.getBalance(wallet.address);
    console.log(`Relay wallet balance: ${ethers.formatEther(balance)} ETH`);
    if (balance === 0n) {
        console.error(" Relay wallet has no ETH — fund it first at https://faucet.triangleplatform.com/zksync/sepolia");
        process.exit(1);
    }
    const pending = await TransactionModel.find({ status: "LOCKED" });
    console.log(`Found ${pending.length} pending transaction(s) to recover`);

    if (pending.length === 0) {
        console.log("Nothing to recover.");
        process.exit(0);
    }
    for (const tx of pending) {
        console.log(`\nChecking: user=${tx.userAddress} requestId=${tx.requestId}`);

        try {
            const onChain = await contract.withdrawals(tx.userAddress, tx.requestId);
            if (!onChain || onChain.amount === 0n) {
                console.log(` Not found on-chain, marking as FAILED`);
                await TransactionModel.findByIdAndUpdate(tx._id, { status: "FAILED", errorMessage: "Not found on-chain" });
                continue;
            }

            if (onChain.isProcessed) {
                console.log(`  Already processed on-chain, updating DB to PAID`);
                await TransactionModel.findByIdAndUpdate(tx._id, { status: "PAID" });
                continue;
            }

            console.log(`Still locked on-chain (amount=${onChain.amount}), triggering payout...`);
            await simulatedBankPayout(tx.userAddress, tx.requestId, tx.lockTxHash);

        } catch (err) {
            console.error(`Error processing ${tx.requestId}: ${err.message}`);
        }
    }

    const currentBlock = await provider.getBlockNumber();
    const resetBlock   = currentBlock - 2000;
    fs.writeFileSync("./relay-state.json", JSON.stringify({ lastBlock: resetBlock }));
    console.log(`\nRelay state reset to block ${resetBlock} (2000 blocks back)`);

    console.log("\nRecovery complete. Now restart your relay server.");
    await mongoose.disconnect();
    process.exit(0);
}

recover().catch(err => {
    console.error("Recovery script failed:", err);
    process.exit(1);
});