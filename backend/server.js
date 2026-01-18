import express from "express"
import { connectDb } from "./utils/DB.js"
import { lockedAmount } from "./controllers/eventListener.controller.js"
import TransactionRoute from "./routes/transaction.route.js"
import dotenv from "dotenv"
dotenv.config()
const app=express()


app.get("/",(req , res)=>{
    res.send("Working....");
})

app.use("/api",TransactionRoute);


app.listen(3000 , async()=>{
    console.log("Server is working!");
    await connectDb()
    await lockedAmount()
    
})
