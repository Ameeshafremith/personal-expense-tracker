
import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware.js";

import {
    addExpense,
    getExpenses,
    editExpense,
    removeExpense
} from "../controllers/expense.controller.js";

const router = Router();

// All expense routes require authentication
router.use(authMiddleware);

// Create an expense
router.post("/", addExpense);

// Get all expenses belonging to the logged-in user
router.get("/", getExpenses);

// Update an expense
router.put("/:expenseId", editExpense);

// Delete an expense
router.delete("/:expenseId", removeExpense);

export default router;
