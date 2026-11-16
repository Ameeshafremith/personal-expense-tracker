
import { Router } from "express";
import {
    addSavingsGoal,
    getAllSavingsGoals,
    getSingleSavingsGoal,
    editSavingsGoal,
    removeSavingsGoal,
    addSavingsMovement,
    getAllSavingsHistory
} from "../controllers/savings.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { getSavingsGrowthReport } from "../controllers/savingsGrowth.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/goals", addSavingsGoal);
router.get("/goals", getAllSavingsGoals);
router.get("/goals/:goalId", getSingleSavingsGoal);
router.put("/goals/:goalId", editSavingsGoal);
router.delete("/goals/:goalId", removeSavingsGoal);

router.post("/movements", addSavingsMovement);
router.get("/history", getAllSavingsHistory);

router.get("/growth", getSavingsGrowthReport);

export default router;
