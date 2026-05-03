import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    userAddress:  { type: String, required: true, lowercase: true },
    requestId:    { type: String, required: true },
    lockTxHash:   { type: String, required: true, unique: true },
    payoutTxHash: { type: String },
    claimTxHash:{type:String},
    raastId:      { type: String, required: true },
    lockedAmount: { type: String, required: true },
    tokenSymbol:  { type: String, default: "CRYPTO" },
    pkrAmount:{type:String , default:"0.00"},
    type:{type:String,
        enum:["SENT" , "DEPOSIT" , "BRIDGE"],
        default:"BRIDGE"
     },
    status: {
        type: String,
        enum: ["LOCKED", "PAID", "FAILED", "REFUNDED","CLAIMED"],
        default: "LOCKED"
    },
    isAdmin: { type: Boolean, default: false },
    errorMessage: { type: String }
}, { timestamps: true });

transactionSchema.index({ userAddress: 1, requestId: 1 });

export default mongoose.model("Transaction", transactionSchema);