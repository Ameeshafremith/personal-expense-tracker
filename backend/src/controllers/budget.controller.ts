
import { Request, Response } from "express";
import {
    createBudget,
    getBudgets,
    updateBudget,
    deleteBudget,
    rolloverBudgets
} from "../services/budget.service.js";
import { checkBudgetCollision } from "../services/budget.service.js";

const getErrorStatus = (message: string) => {
    if (message.includes("not found")) return 404;

    if (
        message.includes("Invalid") ||
        message.includes("must") ||
        message.includes("required") ||
        message.includes("already")
    ) {
        return 400;
    }

    return 500;
};

export const addBudget = async (req: Request, res: Response) => {
    try {
        const { categoryId, amount, month, year, rolloverEnabled } = req.body;

        if (
            !categoryId ||
            amount === undefined ||
            month === undefined ||
            year === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Category, amount, month and year are required"
            });
        }

        const budget = await createBudget(req.user!.userId, {
            categoryId,
            amount: Number(amount),
            month: Number(month),
            year: Number(year),
            rolloverEnabled
        });

        return res.status(201).json({
            success: true,
            message: "Budget created successfully",
            data: budget
        });
    } catch (error: any) {
        return res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message
        });
    }
};

export const getAllBudgets = async (req: Request, res: Response) => {
    try {
        const month = Number(req.query.month);
        const year = Number(req.query.year);

        if (
            !Number.isInteger(month) ||
            month < 1 ||
            month > 12 ||
            !Number.isInteger(year) ||
            year < 2000
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid month and year are required"
            });
        }

        const budgets = await getBudgets(
            req.user!.userId,
            month,
            year
        );

        return res.status(200).json({
            success: true,
            count: budgets.length,
            data: budgets
        });
    } catch (error: any) {
        return res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message
        });
    }
};

export const editBudget = async (req: Request, res: Response) => {
    try {
        const budget = await updateBudget(
            String(req.params.budgetId),
            req.user!.userId,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Budget updated successfully",
            data: budget
        });
    } catch (error: any) {
        return res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message
        });
    }
};

export const removeBudget = async (req: Request, res: Response) => {
    try {
        await deleteBudget(
            String(req.params.budgetId),
            req.user!.userId
        );

        return res.status(200).json({
            success: true,
            message: "Budget deleted successfully"
        });
    } catch (error: any) {
        return res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message
        });
    }
};

export const carryForwardBudgets = async (
    req: Request,
    res: Response
) => {
    try {
        const { month, year } = req.body;

        if (month === undefined || year === undefined) {
            return res.status(400).json({
                success: false,
                message: "Source month and year are required"
            });
        }

        const result = await rolloverBudgets(
            req.user!.userId,
            Number(month),
            Number(year)
        );

        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error: any) {
        return res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message
        });
    }
};

export const checkCollision = async (req: Request, res: Response) => {
    try {
        const { categoryId, plannedAmount, month, year } = req.body;

        const result = await checkBudgetCollision(
            req.user!.userId,
            String(categoryId),
            Number(plannedAmount),
            Number(month),
            Number(year)
        );

        res.status(200).json({
            success: true,
            message: "Budget collision check completed",
            data: result
        });
    } catch (error: any) {
        const status = error.message?.includes("No budget found") ? 404 : 400;

        res.status(status).json({
            success: false,
            message: error.message || "Failed to check budget collision"
        });
    }
};
