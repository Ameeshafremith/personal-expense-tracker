
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";
import { sendPasswordResetEmail } from "../services/email.service.js";

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const createRefreshToken = (): string => {
    return randomBytes(64).toString("hex");
};

const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/auth"
};

const hashRefreshToken = (token: string): string => {
    return createHash("sha256").update(token).digest("hex");
};

export const registerUser = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
            return;
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
            return;
        }

        const passwordHash = await bcrypt.hash(String(password), 12);

        const newUser = await User.create({
            name: String(name).trim(),
            email: normalizedEmail,
            passwordHash
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong during registration"
        });
    }
};

export const loginUser = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
            return;
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        }).select("+passwordHash");

        if (!user) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
            return;
        }

        const isPasswordCorrect = await bcrypt.compare(
            String(password),
            user.passwordHash
        );

        if (!isPasswordCorrect) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
            return;
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("JWT_SECRET is missing");
        }

        // Generate short-lived access token
        const accessToken = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            jwtSecret,
            {
                expiresIn: "15m"
            }
        );

        // Generate a random refresh token
        const refreshToken = randomBytes(64).toString("hex");

        // Store only its SHA-256 hash in MongoDB
        user.refreshTokenHash = hashRefreshToken(refreshToken);

        user.refreshTokenExpiresAt = new Date(
            Date.now() +
            REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
        );

        await user.save();

        // Send refresh token through an HttpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
            path: "/api/auth"
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            token: accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong during login"
        });
    }
};


export const refreshAccessToken = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            res.status(401).json({
                success: false,
                message: "Refresh token is missing. Please log in again."
            });
            return;
        }

        const hashedToken = hashRefreshToken(refreshToken);

        // Find the user with a matching, unexpired refresh token
        const user = await User.findOne({
            refreshTokenHash: hashedToken,
            refreshTokenExpiresAt: { $gt: new Date() }
        }).select("+refreshTokenHash +refreshTokenExpiresAt");

        if (!user) {
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/api/auth"
            });

            res.status(401).json({
                success: false,
                message: "Refresh token is invalid or expired. Please log in again."
            });
            return;
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("JWT_SECRET is missing");
        }

        // Generate a new short-lived access token
        const newAccessToken = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            jwtSecret,
            {
                expiresIn: "15m"
            }
        );

        // Rotate the refresh token
        const newRefreshToken = createRefreshToken();

        user.refreshTokenHash = hashRefreshToken(newRefreshToken);

        user.refreshTokenExpiresAt = new Date(
            Date.now() +
            REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
        );

        await user.save();

        res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);

        res.status(200).json({
            success: true,
            message: "Access token refreshed successfully",
            token: newAccessToken
        });
    } catch (error) {
        console.error("Refresh token error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to refresh access token"
        });
    }
};

export const logoutUser = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (refreshToken) {
            const hashedToken = hashRefreshToken(refreshToken);

            // Revoke the stored refresh token
            await User.updateOne(
                { refreshTokenHash: hashedToken },
                {
                    $unset: {
                        refreshTokenHash: 1,
                        refreshTokenExpiresAt: 1
                    }
                }
            );
        }

        // Clear the browser cookie
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/auth"
        });

        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Logout error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to log out"
        });
    }
};


export const forgotPassword = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();

        if (!email) {
            res.status(400).json({
                success: false,
                message: "Email address is required"
            });
            return;
        }

        const genericMessage =
            "If an account exists with this email, a password reset link will be sent.";

        const user = await User.findOne({ email });

        // Do not reveal whether an email address is registered.
        if (!user) {
            res.status(200).json({
                success: true,
                message: genericMessage
            });
            return;
        }

        // Generate a cryptographically secure reset token.
        const resetToken = randomBytes(32).toString("hex");

        // Store only the SHA-256 hash.
        const resetTokenHash = createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Token expires after 15 minutes.
        user.resetPasswordTokenHash = resetTokenHash;
        user.resetPasswordExpiresAt = new Date(
            Date.now() + 15 * 60 * 1000
        );

        await user.save();

        const frontendUrl = process.env.FRONTEND_URL;

        if (!frontendUrl) {
            throw new Error("FRONTEND_URL is missing");
        }

        const resetLink =
            `${frontendUrl}/reset-password?token=${resetToken}`;

        try {
            await sendPasswordResetEmail(user.email, resetLink);
        } catch (emailError) {
            // Remove the unused token if email delivery fails.
            await User.updateOne(
                { _id: user._id },
                {
                    $unset: {
                        resetPasswordTokenHash: 1,
                        resetPasswordExpiresAt: 1
                    }
                }
            );

            throw emailError;
        }

        res.status(200).json({
            success: true,
            message: genericMessage
        });

    } catch (error) {
        console.error("Forgot password error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to process your request. Please try again later."
        });
    }
};


export const resetPassword = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            res.status(400).json({
                success: false,
                message: "Reset token and new password are required"
            });
            return;
        }

        if (typeof password !== "string" || password.length < 8) {
            res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });
            return;
        }

        if (typeof token !== "string") {
            res.status(400).json({
                success: false,
                message: "Invalid or expired reset link"
            });
            return;
        }

        const resetTokenHash = createHash("sha256")
            .update(token)
            .digest("hex");

        const passwordHash = await bcrypt.hash(password, 12);

        // Atomically find the valid token and consume it.
        // This prevents a token from being reused.
        const user = await User.findOneAndUpdate(
            {
                resetPasswordTokenHash: resetTokenHash,
                resetPasswordExpiresAt: { $gt: new Date() }
            },
            {
                $set: {
                    passwordHash
                },
                $unset: {
                    resetPasswordTokenHash: 1,
                    resetPasswordExpiresAt: 1,

                    // Revoke existing refresh sessions.
                    refreshTokenHash: 1,
                    refreshTokenExpiresAt: 1
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!user) {
            res.status(400).json({
                success: false,
                message: "This password reset link is invalid or has expired."
            });
            return;
        }

        // Clear the refresh-token cookie in the browser.
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/auth"
        });

        res.status(200).json({
            success: true,
            message: "Your password has been reset successfully. Please log in."
        });

    } catch (error) {
        console.error("Reset password error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to reset your password. Please try again."
        });
    }
};


