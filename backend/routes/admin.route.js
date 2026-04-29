import express from "express"
import { confirmOnChainPayout } from "../controllers/contract.controller.js";

const router=express.Router();
router.post("/admin/confirm-payout",confirmOnChainPayout);

export default router