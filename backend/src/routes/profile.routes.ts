import { Router } from "express";

import {
    getProfile,
    editProfile,
    uploadProfilePicture,
    changePassword
} from "../controllers/profile.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

import {
    profilePictureUpload
} from "../middleware/upload.middleware.js";

const router = Router();

// All profile routes require authentication
router.use(authMiddleware);

// Retrieve profile
router.get("/", getProfile);

// Update personal information
router.put("/", editProfile);

// Upload profile picture
router.post(
    "/picture",
    profilePictureUpload,
    uploadProfilePicture
);

// Change password
router.put("/password", changePassword);

export default router;