import {getAllTransaction , getUserTransaction} from "../controllers/transaction.controller.js"
import express from "express"

const router=express.Router()

router.get("/transactions",getAllTransaction)
router.get("/transactions/user/:address",getUserTransaction)

export default router
