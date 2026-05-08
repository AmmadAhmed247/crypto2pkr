import express from "express"
import { confirmOnChainPayout, fundUser } from "../controllers/contract.controller.js";

const router=express.Router();
router.post("/admin/confirm-payout",confirmOnChainPayout);
router.post("/admin/sendfund",fundUser);

export default router