
import { Request, Response } from "express";
import { getDashboardSummary } from "../services/dashboard.service.js";

// Get dashboard summary
export const getDashboard = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const summary = await getDashboardSummary(
            req.user!.userId
        );

        res.status(200).json({
            success: true,
            message: "Dashboard data retrieved successfully",
            dashboard: summary
        });

    } catch (error) {
        console.error("Dashboard error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve dashboard data"
        });
    }
};
