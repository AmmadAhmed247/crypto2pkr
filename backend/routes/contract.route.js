import { getPendingWithdrawals ,checkTxStatus} from "../controllers/contract.controller.js";
import express from "express"
const router=express.Router();

router.get("/status/:txHash",checkTxStatus)
router.post("/pending",getPendingWithdrawals);


router.post("/faucet",async(req , res)=>{
    
})


export default router;