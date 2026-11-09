
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Add authenticated user information to Express Request
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: "user" | "admin";
            };
        }
    }
}

// Verify the JWT token
const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        // Get the Authorization header
        const authHeader = req.headers.authorization;

        // Check whether the token exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                message: "Authentication required. Please provide a token."
            });
            return;
        }

        // Extract the token
        const token = authHeader.split(" ")[1];

        // Check JWT secret
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("JWT_SECRET is missing");
        }

        // Verify the token
        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

        // Validate the token payload
        if (
            typeof decoded.userId !== "string" ||
            (decoded.role !== "user" && decoded.role !== "admin")
        ) {
            res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
            return;
        }

        // Attach authenticated user details to the request
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };

        // Continue to the next middleware or controller
        next();

    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please log in again."
        });
    }
};

export default authMiddleware;
