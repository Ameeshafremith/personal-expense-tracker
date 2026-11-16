
import { Router } from "express";
import {
    addIncome,
    getAllIncomes,
    getSingleIncome,
    markIncomeReceived
} from "../controllers/income.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/", addIncome);
router.get("/", getAllIncomes);
router.get("/:incomeId", getSingleIncome);
router.patch("/:incomeId/receive", markIncomeReceived);

export default router;
