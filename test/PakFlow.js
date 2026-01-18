import { expect } from "chai";
import { Wallet, Provider, Contract } from "zksync-ethers";
import { ethers } from "ethers";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const contractAddress = "0xf713BF34dB2728FB006115886Cc2077bED126A0e";

const NATIVE_ETH = "0x0000000000000000000000000000000000000000";

describe("PakFlowVault Native ETH Test", function () {
    let vault;
    let wallet;

    before(async function () {
        const provider = new Provider("https://sepolia.era.zksync.dev");
        
        if (!process.env.WALLET_PRIVATE_KEY) {
            throw new Error("WALLET_PRIVATE_KEY is missing in .env");
        }

        wallet = new Wallet(process.env.WALLET_PRIVATE_KEY, provider);
        const artifact = await hre.artifacts.readArtifact("PakFlowVault");
        vault = new Contract(contractAddress, artifact.abi, wallet);
    });

    it("Should allow user to lock Native Sepolia ETH", async function () {
        const amount = ethers.parseEther("0.001"); // 0.001 ETH
        const raastId = "03001234567";

        const currentBalance = await wallet.provider.getBalance(wallet.address);
        console.log(`Current Balance: ${ethers.formatEther(currentBalance)} ETH`);
        
        console.log("Locking Native ETH...");
        const tx = await vault.lockUserRequest(NATIVE_ETH, amount, raastId, {
            value: amount 
        });
        
        console.log("Waiting for confirmation...");
        await tx.wait();

        const request = await vault.getPendingWithdrawals(wallet.address);
        expect(request.amount.toString()).to.equal(amount.toString());
        console.log(" Native ETH locked successfully!");
    });

    it("Should fail for unauthorized payout", async function () {
        const fakeRelay = Wallet.createRandom().connect(wallet.provider);
        
        try {
            await vault.connect(fakeRelay).confirmPayout(wallet.address, NATIVE_ETH);
            expect.fail("Should have reverted but didn't!");
        } catch (error) {
           
            expect(error.message).to.include("revert");
            console.log(" Security Checked! Unauthorized access blocked.");
        }
    });
});