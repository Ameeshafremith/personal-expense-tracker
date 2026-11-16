
import { Router } from "express";
import {
    addTransaction,
    getAllTransactions,
    getSingleTransaction,
    editTransaction,
    removeTransaction
} from "../controllers/transaction.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/", addTransaction);
router.get("/", getAllTransactions);
router.get("/:transactionId", getSingleTransaction);
router.put("/:transactionId", editTransaction);
router.delete("/:transactionId", removeTransaction);

export default router;
