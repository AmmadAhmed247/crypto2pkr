import mongoose, { Schema } from "mongoose";


const faucetSchema=new Schema({

    address:String , 
    claims:{
        type:Number,default:0
    }
})

export default mongoose.model('Faucet',faucetSchema);