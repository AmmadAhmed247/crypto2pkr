import express from "express"
import { getAllQueries, updateContactQueries } from "../controllers/Contact.controller.js";

const router=express.Router();

router.post("/user-queries",updateContactQueries);
router.get("/user-queries-data", getAllQueries);

export default router;