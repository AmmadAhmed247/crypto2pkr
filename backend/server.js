import express from "express"
import { connectDb } from "./utils/DB.js"
import { lockedAmount } from "./controllers/eventListener.controller.js"
import TransactionRoute from "./routes/transaction.route.js"
import { startEventListeneres } from "./services/blockchainService.js"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()
const app=express()
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
}))

app.get("/",(req , res)=>{
    res.send("Working....");
})

app.use("/api",TransactionRoute);

app.listen(3000 , async()=>{
    console.log("Server is working!");
    await connectDb()
    // await lockedAmount()   
    await startEventListeneres()
})
