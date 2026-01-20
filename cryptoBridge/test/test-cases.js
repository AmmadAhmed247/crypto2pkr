import { expect } from "chai";
import { ethers } from "ethers";
import { Wallet , Provider  , Contract } from "zksync-ethers";
import  hre from "hardhat"
import dotenv from "dotenv"
dotenv.config();

const contractAddress="0xB7BA351462DCf8d636e59550E83378E7363FDF1a"
const NATIVE_ETH="0x0000000000000000000000000000000000000000"
const WALLET_PRIVATE_KEY=process.env.WALLET_PRIVATE_KEY
const WALLET_PRIVATE_KEY2=process.env.WALLET_PRIVATE_KEY2

describe('PAK FLOW PROTOCOL -- COMPLETE TEST ',  () => { 
    let contract , userWallet , relayWallet , provider ;
    before(async()=>{
        provider=new Provider("https://sepolia.era.zksync.dev");
        if (! WALLET_PRIVATE_KEY && !WALLET_PRIVATE_KEY2) {
            throw new Error("Wallet key is Missing !")
        }

        userWallet=new Wallet(WALLET_PRIVATE_KEY2 , provider);
        relayWallet=new Wallet(WALLET_PRIVATE_KEY , provider);
        const artifact=await hre.artifacts.readArtifact("PakFlowVault");
        contract=new Contract(contractAddress , artifact.abi ,userWallet);
        console.log("\n All Necessary Details");
        console.log(`Contract Address: ${contractAddress}`);
        console.log(`Owner Address: ${userWallet.address}`);
        console.log(`Relay Address: ${relayWallet.address} \n`);  
    });
    it("Should confirm the payout of the user",async()=>{
        const before=await contract.pendingWithdrawals(userWallet.address);
        console.log("Amount:",before.amount.toString());
        const tx=await contract.connect(relayWallet).confirmPayout(userWallet.address);
        await tx.wait();
        console.log("Payout confirmed:",tx.txHash);
        const after=await contract.pendingWithdrawals(userWallet.address);
        expect(after.amount.toString()).to.be.equal("0");
        console.log(`Confirmed by ${relayWallet.address}`);
    })
    it("Should lock ETH Amount",async()=>{
        const amount=ethers.parseEther("0.0001");
        console.log(`Amount:${amount}`);
        const raastId="031313131";
        const tx=await contract.lockUserRequest(NATIVE_ETH , amount , raastId,{
            value:amount
        });
        await tx.wait();
        const request=await contract.pendingWithdrawals(userWallet.address);
        expect(request.amount.toString()).to.be.equal(amount.toString());
        console.log("ETH is now locked!");
    });
    it("Should reject the confirm payout ",async()=>{
        try {
            await contract.confirmPayout(userWallet.address);
        } catch (error) {
            expect(error.message).to.include("Not Authorized Server");
            console.log("Security Verfied Successfully blocked the unauthorize request!");
        }
    });
    it("Should prevent immediate refund",async()=>{
        try {
            await contract.requestFund();
            expect.fail("Should have reverted");
        } catch (error) {
            expect(error.message).to.include("Refund timelock active");
            console.log("Time lock protect user cannot take refund instantly!");

        }
    })
    it("Should allow owner to whitelist the new token",async()=>{
        const mockToken="0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
        const tx=await contract.connect(relayWallet).updateWhiteListedTokenList(mockToken , true);
        await tx.wait();
        const isWhitelisted=await contract.whiteListedTokens(mockToken);
        expect(isWhitelisted).to.be.true;
        console.log("White listed Checked!");
    })

 })


