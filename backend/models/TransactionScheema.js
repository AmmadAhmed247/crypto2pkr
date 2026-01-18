import {mongoose,Schema} from "mongoose"


const Transaction=new Schema({
    userAddress:{type:String , required:true},
    txHash:{type:String , required:true , unique:true },
    raastId:{type:String , required:true},
    lockedAmount:{type:String  ,required:true },
    token:{type:String , required:true},
    payoutStatus:{type:String ,enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"], 
        default: "PENDING"
    },
    createdAt:{type:Date , default:Date.now}

})

export default mongoose.model("User",Transaction);