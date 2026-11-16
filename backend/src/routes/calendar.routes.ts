
import { Router } from "express";
import { getExpenseCalendar } from "../controllers/calendar.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getExpenseCalendar);

export default router;
