import { Request, Response } from "express";
import {
    getUserProfile,
    updateUserProfile
} from "../services/profile.service.js";
import bcrypt from "bcryptjs";
import cloudinary from "../config/cloudinary.js";
import User from "../models/user.model.js";
import type { UploadApiResponse } from "cloudinary";

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

export const uploadProfilePicture = async (
    req: Request,
    res: Response
) => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: "Please select an image."
            });
            return;
        }

        const uploadedImage = await new Promise<UploadApiResponse>(
            (resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "expenseflow/profile-pictures",
                        resource_type: "image"
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else if (result) {
                            resolve(result);
                        } else {
                            reject(new Error("Image upload failed."));
                        }
                    }
                );

                stream.end(req.file!.buffer);
            }
        );

        const profile = await User.findByIdAndUpdate(
            req.user!.userId,
            {
                $set: {
                    profilePicture: uploadedImage.secure_url
                }
            },
            {
                new: true,
                runValidators: true
            }
        ).select(
            "name email role mobileNumber profilePicture financialYearStartMonth createdAt"
        );

        if (!profile) {
            res.status(404).json({
                success: false,
                message: "User not found."
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Profile picture uploaded successfully.",
            data: profile
        });

    } catch (error: any) {
        console.error("Profile picture upload error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to upload profile picture."
        });
    }
};

export const changePassword = async (
    req: Request,
    res: Response
) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            res.status(400).json({
                success: false,
                message: "Current password and new password are required."
            });
            return;
        }

        if (String(newPassword).length < 8) {
            res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters long."
            });
            return;
        }

        const user = await User.findById(req.user!.userId)
            .select("+passwordHash");

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found."
            });
            return;
        }

        const passwordMatches = await bcrypt.compare(
            currentPassword,
            user.passwordHash
        );

        if (!passwordMatches) {
            res.status(400).json({
                success: false,
                message: "Current password is incorrect."
            });
            return;
        }

        const samePassword = await bcrypt.compare(
            newPassword,
            user.passwordHash
        );

        if (samePassword) {
            res.status(400).json({
                success: false,
                message: "Your new password must be different."
            });
            return;
        }

        user.passwordHash = await bcrypt.hash(newPassword, 12);

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully."
        });

    } catch (error: any) {
        console.error("Change password error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to change password."
        });
    }
};