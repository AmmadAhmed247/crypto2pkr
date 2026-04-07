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
        const transactions = await Transaction.find({ userAddress: userAddr });
        let totalBridgedPKR = 0;
        let totalClaimingPKR = 0;
        
        let volumes = {
            eth: 0,
            usdc: 0,
            usdt: 0
        };
        transactions.forEach(tx => {
            const pkr = parseFloat(tx.pkrAmount?.toString().replace(/,/g, '') || 0);
            totalBridgedPKR += pkr;
            const symbol = tx.tokenSymbol?.toLowerCase(); 
            const cryptoAmt = parseFloat(tx.lockedAmount || 0);

            if (symbol && volumes.hasOwnProperty(symbol)) {
                volumes[symbol] += cryptoAmt;
            }

            if (tx.status === "LOCKED") {
                totalClaimingPKR += pkr;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalBridged: totalBridgedPKR.toLocaleString("en-US", { minimumFractionDigits: 2 }),
                totalClaiming: totalClaimingPKR.toLocaleString("en-US", { minimumFractionDigits: 2 }),
                ethTotal: volumes.eth.toFixed(4),
                usdcTotal: volumes.usdc.toFixed(2),
                count: transactions.length
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};