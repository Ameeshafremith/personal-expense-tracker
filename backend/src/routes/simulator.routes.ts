
import { Router } from "express";
import { runPurchaseSimulation } from "../controllers/simulator.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/simulate", runPurchaseSimulation);

export default router;
