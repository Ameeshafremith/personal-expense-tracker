
import { Request, Response, NextFunction } from "express";

// Define the allowed user roles
type UserRole = "user" | "admin";

// Middleware to check user roles
const authorizeRoles = (...allowedRoles: UserRole[]) => {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ): void => {

        // Check whether the user is authenticated
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required"
            });
            return;
        }

        // Check whether the user's role is permitted
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: "Access denied. You do not have permission."
            });
            return;
        }

        // User has permission
        next();
    };
};

export default authorizeRoles;
