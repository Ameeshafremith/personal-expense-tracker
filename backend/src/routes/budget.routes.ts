
import { Router } from "express";
import {
    addBudget,
    getAllBudgets,
    editBudget,
    removeBudget,
    carryForwardBudgets
} from "../controllers/budget.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import {
    checkCollision
} from "../controllers/budget.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/", addBudget);
router.get("/", getAllBudgets);
router.put("/:budgetId", editBudget);
router.delete("/:budgetId", removeBudget);
router.post("/rollover", carryForwardBudgets);
router.post("/check-collision", checkCollision);

export default router;
