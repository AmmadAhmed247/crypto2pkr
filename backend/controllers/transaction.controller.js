import Transaction from "../models/TransactionSchema.js";

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
        const txs=await Transaction.find({userAddress:address}).sort({createdAt:-1});
        const totalPkr=txs.reduce((sum , tx)=>{
            const amount = tx.pkrAmount ? parseFloat(tx.pkrAmount.replace(/,/g, '')) : 0;
            return sum+(isNaN(amount)? 0 :  amount)
        },0)
        const totalUsd=txs.reduce((sum ,  tx)=>{
            const usdAmount=tx.lockedAmount ? parseFloat(tx.lockedAmount): 0 ; 
            return sum+(isNaN(usdAmount) ? 0 : usdAmount)
        },0)
        res.status(200).json({transactions:txs ,
            totalUsd:totalUsd.toLocaleString("en-US",{
            minimumFractionDigits:2
        }) , totalPkr: totalPkr.toLocaleString("en-US",{
            minimumFractionDigits:2
        }) });
    } catch (error) {
        res.status(500).json({"Error":error.message})
    }
}


export const getAccountStats = async (req, res) => {
    try {
        const { address } = req.params;
        const userAddr = address.toLowerCase();
        const stats = await Transaction.aggregate([
            { $match: { userAddress: userAddr } },
            {
                $group: {
                    _id: null,
                    totalBridged: { 
                        $sum: { $toDouble: { $replaceAll: { input: "$pkrAmount", find: ",", replacement: "" } } } 
                    },
                    totalCrypto: { $sum: { $toDouble: "$lockedAmount" } },
                    totalClaiming: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "LOCKED"] }, { $toDouble: { $replaceAll: { input: "$pkrAmount", find: ",", replacement: "" } } }, 0]
                        }
                    },
                    totalReceived: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "RECEIVED"] }, { $toDouble: "$lockedAmount" }, 0]
                        }
                    },
                    txCount: { $sum: 1 }
                }
            }
        ]);

        const result = stats[0] || { totalBridged: 0, totalCrypto: 0, totalClaiming: 0, totalReceived: 0, txCount: 0 };

        res.status(200).json({
            success: true,
            data: {
                totalBridged: result.totalBridged.toLocaleString("en-US", { minimumFractionDigits: 2 }),
                totalCrypto: result.totalCrypto.toFixed(4),
                totalClaiming: result.totalClaiming.toLocaleString("en-US", { minimumFractionDigits: 2 }),
                receivedVolume: result.totalReceived.toFixed(4),
                count: result.txCount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};