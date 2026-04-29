import express from "express"
import { connectDb } from "./utils/DB.js"
import TransactionRoute from "./routes/transaction.route.js"
import ContractRoute from "./routes/contract.route.js"
import { startEventListeners } from "./services/blockchainService.js"
import cors from "cors"
import dotenv from "dotenv"
import AdminRoute from "./routes/admin.route.js"
dotenv.config()
const app=express()
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.get("/",(req , res)=>{
    res.send("Working....");
})

app.use("/api",TransactionRoute);
app.use("/api",ContractRoute);
app.use("/api",AdminRoute);

app.listen(3000 , async()=>{
    console.log("Server is working!");
    await connectDb()
    await startEventListeners()
})
