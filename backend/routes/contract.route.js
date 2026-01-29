import { getPendingWithdrawals ,checkTxStatus} from "../controllers/contract.controller";
import express from "express"
const router=express.Router();

router.get("/status/:txHash",checkTxStatus)
router.post("/pending",getPendingWithdrawals);
