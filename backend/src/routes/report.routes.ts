
import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { generateExpenseReport } from "../controllers/report.controller.js";

const router = Router();

// All report routes require authentication
router.use(authMiddleware);

// Generate and download PDF expense report
router.get("/pdf", generateExpenseReport);

export default router;
