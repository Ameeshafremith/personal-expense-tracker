import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const registerUser = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
            return;
        }

        // Normalize email
        const normalizedEmail = String(email).trim().toLowerCase();

        // Check whether the email is already registered
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

        // Hash the password before saving it
        const passwordHash = await bcrypt.hash(String(password), 12);

        // Create the new user
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

        // Validate required fields
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
            return;
        }

        // Normalize email
        const normalizedEmail = String(email).trim().toLowerCase();

        // Find user and include passwordHash
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

        // Compare entered password with stored hash
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

        // Check JWT secret
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("JWT_SECRET is missing");
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            jwtSecret,
            {
                expiresIn: "1h"
            }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
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