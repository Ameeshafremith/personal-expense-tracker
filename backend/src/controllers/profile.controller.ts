import { Request, Response } from "express";
import {
    getUserProfile,
    updateUserProfile
} from "../services/profile.service.js";

export const getProfile = async (req: Request, res: Response) => {
    try {
        const profile = await getUserProfile(req.user!.userId);

        res.status(200).json({
            success: true,
            message: "Profile retrieved successfully",
            data: profile
        });
    } catch (error: any) {
        res.status(error.message === "User not found" ? 404 : 500).json({
            success: false,
            message: error.message || "Failed to retrieve profile"
        });
    }
};

export const editProfile = async (req: Request, res: Response) => {
    try {
        const {
            name,
            email,
            mobileNumber,
            profilePicture
        } = req.body;

        const profile = await updateUserProfile(req.user!.userId, {
            name,
            email,
            mobileNumber,
            profilePicture
        });

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: profile
        });
    } catch (error: any) {
        const status =
            error.code === 11000 ? 409 :
            error.message === "User not found" ? 404 :
            400;

        res.status(status).json({
            success: false,
            message:
                error.code === 11000
                    ? "This email address is already registered"
                    : error.message || "Failed to update profile"
        });
    }
};