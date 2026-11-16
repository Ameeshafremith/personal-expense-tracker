
import { Router } from "express";
import { getFinancialYearReport } from "../controllers/financialYear.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getFinancialYearReport);

export default router;
