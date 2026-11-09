import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.js";

const router = Router();

// User registration
router.post("/register", registerUser);

export default router;