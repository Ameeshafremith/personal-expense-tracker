import { Request, Response } from "express";
import { getSavingsGrowth } from "../services/savingsGrowth.service.js";

export const getSavingsGrowthReport = async (
    req: Request,
    res: Response
) => {
    try {
        const year = Number(req.query.year);

        if (!req.query.year || !Number.isInteger(year)) {
            res.status(400).json({
                success: false,
                message: "A valid year is required"
            });
            return;
        }

        const result = await getSavingsGrowth(
            req.user!.userId,
            year
        );

        res.status(200).json({
            success: true,
            message: "Savings growth retrieved successfully",
            data: result
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to retrieve savings growth"
        });
    }
};