
import { Request, Response } from "express";
import User from "../models/user.model.js";
import { getFinancialYearSummary } from "../services/financialYear.service.js";

export const getFinancialYearReport = async (
    req: Request,
    res: Response
) => {
    try {
        const year = Number(req.query.year);

        if (!req.query.year) {
            res.status(400).json({
                success: false,
                message: "Financial year is required"
            });
            return;
        }

        const user = await User.findById(req.user!.userId);

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        const summary = await getFinancialYearSummary(
            req.user!.userId,
            year,
            user.financialYearStartMonth ?? 1
        );

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error: any) {
        const message = error.message || "Failed to generate financial year report";

        res.status(
            message.includes("valid") || message.includes("must be")
                ? 400
                : 500
        ).json({
            success: false,
            message
        });
    }
};
