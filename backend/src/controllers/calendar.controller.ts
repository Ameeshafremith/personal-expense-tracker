
import { Request, Response } from "express";
import { getMonthlyExpenseCalendar } from "../services/calendar.service.js";

export const getExpenseCalendar = async (
    req: Request,
    res: Response
) => {
    try {
        const month = Number(req.query.month);
        const year = Number(req.query.year);

        if (!req.query.month || !req.query.year) {
            res.status(400).json({
                success: false,
                message: "Month and year are required"
            });
            return;
        }

        const calendar = await getMonthlyExpenseCalendar(
            req.user!.userId,
            month,
            year
        );

        res.status(200).json({
            success: true,
            data: calendar
        });
    } catch (error: any) {
        const message = error.message || "Failed to retrieve expense calendar";

        res.status(message.includes("valid month") ? 400 : 500).json({
            success: false,
            message
        });
    }
};
