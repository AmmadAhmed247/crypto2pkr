import { expect } from "chai";
import { ethers } from "ethers";
import { Wallet , Provider  , Contract } from "zksync-ethers";
import  hre from "hardhat"
import dotenv from "dotenv"

dotenv.config();

const contractAddress="0x88F3413e02751A860b4eb13689F0D96e97cb15A4"
const NATIVE_ETH="0x0000000000000000000000000000000000000000"
const WALLET_PRIVATE_KEY=process.env.WALLET_PRIVATE_KEY

describe("PakFlowVault",()=>{
    let vault  , wallet; 
    before(async ()=>{
        const provider=new Provider("https://sepolia.era.zksync.dev")
         const network = await provider.getNetwork();
    console.log(`\n Test running on ChainId: ${network.chainId}`);
        if(!WALLET_PRIVATE_KEY){
            throw new Error(("Wallet key is missing!"))
        }
        wallet=new Wallet(WALLET_PRIVATE_KEY  , provider);
        const artifact=await hre.artifacts.readArtifact("PakFlowVault");
        vault=new Contract(contractAddress , artifact.abi , wallet);
    })
    it("Should confirm the payout",async()=>{
        console.log("Clearing pending withdrawals...");
        const relayWallet=new Wallet(process.env.WALLET_PRIVATE_KEY2,wallet.provider)

        const vaultRelay=vault.connect(relayWallet)
        try {
            const tx=await vaultRelay.confirmPayout(wallet.address , NATIVE_ETH);
            await tx.wait();
            console.log(tx.hash);
            console.log("pending withdrawal cleared!");
        } catch (error) {
        console.log("Could not clear....");
        console.error(error.message);        
        }         
    })
    it("Should allow user to locked the Amount",async()=>{
        const amount=ethers.parseEther("0.0001");
        const raastId="01010100101001";
        const currentBalance=await wallet.provider.getBalance(wallet.address);
        console.log(`Current User Balance -- ${ethers.formatEther(currentBalance)}`);
        const tx=await vault.lockUserRequest(NATIVE_ETH , amount , raastId,{value:amount});
        console.log("Waiting For Confirmation!");
        await tx.wait();
        const request=await vault.getPendingWithdrawals(wallet.address)
        expect(request.amount.toString()).to.be.equal(amount.toString());
        console.log("ETH locked SuccessFully!");        
    })
    it("Should return the pending withdrawls",async()=>{
        const request=await vault.getPendingWithdrawals(wallet.address);
        console.log(`Total Pending Withdrawals: Amount ${request.amount} RaastId:${request.raastId} IsProcessed:${request.isProcessed}`);
        console.log("Address:",wallet.address);
    })
    it("Should update the token in whitelisted",async()=>{
        const usdcAddress="0x3600000000000000000000000000000000000000";
        const USDTAddress="0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
        const whitelisted=await vault.whiteListedTokens(USDTAddress);
        console.log(`before adding :${whitelisted}`);
        const tx=await vault.updateWhiteListedTokenList(USDTAddress , true);
        await tx.wait();
        const whitelistedAfter=await vault.whiteListedTokens(USDTAddress);
        console.log(`After adding a new address: ${whitelistedAfter}`);
        expect(whitelistedAfter).to.be.true;
    })
})



