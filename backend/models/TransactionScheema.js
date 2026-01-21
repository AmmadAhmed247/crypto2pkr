import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    userAddress: { type: String, required: true, index: true, lowercase: true },
    raastId: { type: String, required: true },
    lockedAmount: { type: String, required: true },
    tokenSymbol: { type: String, default: "ETH" },
    lockTxHash: { type: String, unique: true }, 
    payoutTxHash: { type: String },           
    status: { 
        type: String, 
        enum: ['LOCKED', 'PROCESSING', 'PAID', 'REFUNDED'], 
        default: 'LOCKED' 
    },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Transaction", transactionSchema);