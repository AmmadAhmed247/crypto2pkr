import {getAllTransaction , getUserTransaction, getAccountStats} from "../controllers/transaction.controller.js"
import express from "express"

const router=express.Router()

router.get("/transactions",getAllTransaction)
router.get("/transactions/user/:address",getUserTransaction)
router.get("/user/analytics/:address",getAccountStats)

export default router
