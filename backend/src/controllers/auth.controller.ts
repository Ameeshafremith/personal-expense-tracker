
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";

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

