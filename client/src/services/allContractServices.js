import {BrowserProvider , Contract } from "zksync-ethers"

import vaultAbi from "../utils/abi.json" with {type:"json"}
const contractAddress=import.meta.env.CONTRACT_ADDRESS;

const getContract=async()=>{
    const provider=new BrowserProvider(window.ethereum);
    const signer=await provider.getSigner();
    return new Contract(contractAddress , vaultAbi.abi , signer)
};

export const lockUserFunds=async(tokenAddress , amount  , raastId)=>{
    const contract=await getContract();
    const parsedAmount=parseUnits(amount.toString() ,18);
    const isEth=tokenAddress==="0x0000000000000000000000000000000000000000";
    const tx=await contract.lockUserRequest(tokenAddress , parsedAmount , raastId,{ value: isEth ? parsedAmount : 0 });
    return await tx.wait();
}
export const getPending=async(userAddress)=>{
    const contract=await getContract();
    return await contract.getPendingWithdrawals(userAddress)
}

export const refundFunds=async()=>{
    const contract=await getContract();
    const tx=await contract.requestFund();
    return await tx.wait();
}

    