
import { Router } from "express";
// import { registerUser, loginUser } from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import User from "../models/user.model.js";
import {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);

router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user!.userId).select(
            "name email role"
        );

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Profile error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve user profile"
        });
    }
});

export default router;
