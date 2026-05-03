import express from "express"
import { connectDb } from "./utils/DB.js"
import TransactionRoute from "./routes/transaction.route.js"
import ContractRoute from "./routes/contract.route.js"
import { startEventListeners } from "./services/blockchainService.js"
import cors from "cors"
import dotenv from "dotenv"
import AdminRoute from "./routes/admin.route.js"
import ContactRoute from "./routes/contact.route.js"
import TransactionScheema from "./models/TransactionSchema.js"
dotenv.config()
const app=express()
app.use(express.json());
app.use(cors({
  origin:"https://crypto2pkr.vercel.app",
  credentials: true
}));
app.get("/",(req , res)=>{
    res.send("Working....");
})
app.use("/api",TransactionRoute);
app.use("/api",ContractRoute);
app.use("/api",AdminRoute);
app.use("/api",ContactRoute);
app.get("/api/me", async (req, res) => {
  let { address } = req.query;
console.log("Incoming:", address);
  if (!address) return res.json({ isAdmin: false });
  address = address.toLowerCase();
  const admin = await TransactionScheema.findOne({
    userAddress: address,
    isAdmin: true
  });
  console.log("DB match:", admin);
  res.json({ isAdmin: !!admin });
});

app.listen(3000 , async()=>{
    console.log("Server is working!");
    await connectDb()
    await startEventListeners()
})
