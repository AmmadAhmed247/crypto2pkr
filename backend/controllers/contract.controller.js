import express from "express"
import {Wallet , Provider , Contract } from "zksync-ethers"
import vaultAbi from "../utils/abi.json" with {type:"json"};

import TransactionScheema from "../models/TransactionScheema.js"
import { ethers } from "ethers";
const CONTRACT_ADDRESS=process.env.CONTRACT_ADDRESS;
const privateKey=process.env.ADMIN_Wallet_KEY;
const provider=new Provider("https://sepolia.era.zksync.dev");
const wallet=new Wallet(privateKey , provider);
const contract=new Contract(CONTRACT_ADDRESS , vaultAbi.abi , wallet);


export const confirmOnChainPayout=async(userAddress)=>{
    try {
        console.log(`Confirming on~chain payout for :${userAddress}`);

        const tx=await contract.confirmPayout(userAddress);
        const recipt=await tx.wait();

        console.log(`on chain payout confirmed: TX~HASH ${recipt.hash}`);
        return recipt.hash;
    } catch (error) {
        console.error(`relay server error...${error.message}`);
        throw error;
    }
}

export const getPendingWithdrawals=async(req  ,  res)=>{
    try {
        const{userAddress}=req.body;
        const details=await contract.getPendingWithdrawals(userAddress);
        res.status(200).json({
            amount:ethers.formatEther(details.amount),
            raastId:details.raastId,
            isProcessed:details.isProcessed,
            isPending:details.amount>0n
        });


    } catch (error) {
        res.status(500).json({error:error.message});
    }
}

export const checkTxStatus=async(req  ,  res)=>{
    try {
        const{txHash}=req.params;
        const tx=await TransactionScheema.findOne({lockTxHash:txHash});
        if(!tx){
            return res.status(400).json({message:"not found..."});
        }

        res.status(200).json({status:tx.status , data:tx});
    } catch (error) {
        res.status(500).json({error:error.message});
    }
}