import { Wallet , Provider , Contract } from "zksync-ethers";
import Transaction from "../models/TransactionScheema";
import vaultABI from "../utils/abi.json" with { type: "json" };
import { Transaction } from "ethers";
const provider=new Provider("https://sepolia.era.zksync.dev")
const adminWallet=process.env.ADMIN_Wallet_KEY;
const contract=new Contract(process.env.CONTRACT_ADDRESS , vaultABI.abi , provider)

export const simulatedBankPayout=async(userAddress , tokenAddress , raastId)=>{
    await new Promise(resolve => {
        setTimeout(resolve , 10000)
    })
    try {
        console.log(`PKR send via RAAST --- Relasing Crypto To Treasury`);
        const tx=await contract.confirmPayout(userAddress , tokenAddress);
        await tx.wait();
        await Transaction.findOneAndUpdate({txHash:txHash},{payoutStatus:"COMPLETED"})
        console.log(`Payout SuccessFull user Address :${userAddress}`);       
    } catch (error) {
        console.error(error.message);
        await Transaction.findOneAndUpdate({txHash:txHash}, {payoutStatus:"FAILED"})       
    }
}