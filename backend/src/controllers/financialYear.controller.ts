
import { Request, Response } from "express";
import User from "../models/user.model.js";
import { getFinancialYearSummary } from "../services/financialYear.service.js";

export const getFinancialYearReport = async (
    req: Request,
    res: Response
) => {
    try {
        const yearParam = req.query.year;

        if (!yearParam || typeof yearParam !== "string") {
            res.status(400).json({
                success: false,
                message: "Financial year is required"
            });
            return;
        }

        const year = Number(yearParam);

        if (!Number.isInteger(year) || year < 2000 || year > 2100) {
            res.status(400).json({
                success: false,
                message: "Please provide a valid financial year"
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
            user.financialYearStartMonth ?? 4
        );

        res.status(200).json({
            success: true,
            data: summary
        });

    } catch (error: unknown) {
        const message =
            error instanceof Error
                ? error.message
                : "Failed to generate financial year report";

        const isValidationError =
            message.includes("valid") ||
            message.includes("must be");

        res.status(isValidationError ? 400 : 500).json({
            success: false,
            message
        });
    }
};
