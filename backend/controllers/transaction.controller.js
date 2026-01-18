import Transaction from "../models/TransactionScheema.js";





export const getAllTransaction=async(req , res)=>{
    try {
        const txs=await Transaction.find().sort({createdAt:-1});
        res.status(200).json(txs)
    } catch (error) {
        res.status(500).json({"Error":error.message})
    }
}

export const getUserTransaction=async(req , res)=>{
    try {
        const {address}=req.params;
        console.log(address);
        const txs=await Transaction.find({userAddress:address});
        res.status(200).json(txs);
    } catch (error) {
        res.status(500).json({"Error":error.message})
    }
}