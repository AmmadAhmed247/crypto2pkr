import { Provider, Contract } from "zksync-ethers"
import Transaction from "../models/TransactionScheema.js";
import { ethers } from "ethers"
import vaultABI from "../utils/abi.json" with { type: "json" };
import { simulatedBankPayout } from "../utils/payout.js";
const contractAddress = process.env.CONTRACT_ADDRESS;
const URL = "https://sepolia.era.zksync.dev"
const provider=new Provider(URL)
const contract = new Contract(contractAddress, vaultABI.abi, provider);

export const lockedAmount = async () => {
    contract.on("LockInitiated", async (user, token, amount, raastId, timestamp, event) => {
        console.log(`\n new LockAmount Detected..`);
        try {
            const newTx = new Transaction({
                userAddress: user.toLowerCase(),
                txHash: event.log.transactionHash,
                raastId: raastId,
                lockedAmount: ethers.formatEther(amount),
                token: token,
                payoutStatus: "PENDING",
            })
            await newTx.save();
            console.log("Transaction Saved in DB!");            
        } catch (error) {
            console.error("Error while saving the data into the db",error.message);
        }
        simulatedBankPayout(user , token , event.log.transactionHash);
    })
    console.log("Listener is On!");    
}

// export const getPendingWithdrawals=async(userAddress)=>{
//     try {
//         const req=await contract.pendingWithdrawals(userAddress);
//         return
//         {
//             amount:ethers.formatEther(req.amount),
//             raastId:req.raastId,
//             isProcessed:req.isProcessed,
//             timestamp:req.timestamp.toString()
//         };
//     } catch (error) {
//         console.error(error.message);
//         throw error;
//     }
// }


export const checkWhiteListedToken=async(_token)=>{
    try {
       return await contract.whiteListedTokens(_token);
    } catch (error) {
        console.error(error.message);
        return false;
    }
}

export const getRelayServerAddress=async()=>{
    try {
        return await contract.relayServer();
    } catch (error) {
        console.error(error.message);
    }
}