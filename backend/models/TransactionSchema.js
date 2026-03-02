import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    userAddress:  { type: String, required: true, lowercase: true },
    requestId:    { type: String, required: true },
    lockTxHash:   { type: String, required: true, unique: true },
    payoutTxHash: { type: String },
    raastId:      { type: String, required: true },
    lockedAmount: { type: String, required: true },
    tokenSymbol:  { type: String, default: "CRYPTO" },
    status: {
        type: String,
        enum: ["LOCKED", "PAID", "FAILED", "REFUNDED"],
        default: "LOCKED"
    },
    errorMessage: { type: String }
}, { timestamps: true });

transactionSchema.index({ userAddress: 1, requestId: 1 });

export default mongoose.model("Transaction", transactionSchema);