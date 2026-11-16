import { Router } from "express";
import {
    getProfile,
    editProfile
} from "../controllers/profile.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getProfile);
router.put("/", editProfile);

export default router;