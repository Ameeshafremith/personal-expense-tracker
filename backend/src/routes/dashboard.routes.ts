
import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { getDashboard } from "../controllers/dashboard.controller.js";

const router = Router();

// Dashboard requires authentication
router.use(authMiddleware);

// Get dashboard statistics
router.get("/", getDashboard);

export default router;
