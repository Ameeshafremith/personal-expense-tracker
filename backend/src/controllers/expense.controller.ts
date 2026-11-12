
import { Request, Response } from "express";
import mongoose from "mongoose";

import {
    createExpense,
    getUserExpenses,
    updateExpense,
    deleteExpense
} from "../services/expense.service.js";

// Create an expense
export const addExpense = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { title, amount, date, categoryId } = req.body;

        // Validate required fields
        if (
            !title ||
            amount === undefined ||
            !date ||
            !categoryId
        ) {
            res.status(400).json({
                success: false,
                message: "Title, amount, date and category are required"
            });
            return;
        }

        // Validate title
        if (
            typeof title !== "string" ||
            !title.trim() ||
            title.trim().length > 100
        ) {
            res.status(400).json({
                success: false,
                message: "Title must be between 1 and 100 characters"
            });
            return;
        }

        // Validate amount
        if (
            typeof amount !== "number" ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            res.status(400).json({
                success: false,
                message: "Amount must be a valid number greater than zero"
            });
            return;
        }

        // Validate date
        const expenseDate = new Date(date);

        if (typeof date !== "string" || Number.isNaN(expenseDate.getTime())) {
            res.status(400).json({
                success: false,
                message: "Please provide a valid date"
            });
            return;
        }

        // Validate category ID
        if (
            typeof categoryId !== "string" ||
            !mongoose.Types.ObjectId.isValid(categoryId)
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid category ID"
            });
            return;
        }

        const expense = await createExpense(
            req.user!.userId,
            {
                title: title.trim(),
                amount,
                date: expenseDate,
                categoryId
            }
        );

        if (!expense) {
            res.status(400).json({
                success: false,
                message: "Category not found or does not belong to you"
            });
            return;
        }

        res.status(201).json({
            success: true,
            message: "Expense created successfully",
            expense
        });

    } catch (error) {
        console.error("Create expense error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create expense"
        });
    }
};


// Get expenses with optional filters
export const getExpenses = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { categoryId, startDate, endDate } = req.query;

        // Validate query parameter types
        if (
            (categoryId !== undefined && typeof categoryId !== "string") ||
            (startDate !== undefined && typeof startDate !== "string") ||
            (endDate !== undefined && typeof endDate !== "string")
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid filter parameters"
            });
            return;
        }

        // Validate category ID
        if (
            categoryId &&
            !mongoose.Types.ObjectId.isValid(categoryId)
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid category ID"
            });
            return;
        }

        // Convert and validate dates
        const parsedStartDate = startDate
            ? new Date(startDate)
            : undefined;

        const parsedEndDate = endDate
            ? new Date(endDate)
            : undefined;

        if (
            (parsedStartDate && Number.isNaN(parsedStartDate.getTime())) ||
            (parsedEndDate && Number.isNaN(parsedEndDate.getTime()))
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid date filter"
            });
            return;
        }

        // Include the entire end date when a date-only value is provided
        if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
            parsedEndDate!.setUTCHours(23, 59, 59, 999);
        }

        // Validate date range
        if (
            parsedStartDate &&
            parsedEndDate &&
            parsedStartDate > parsedEndDate
        ) {
            res.status(400).json({
                success: false,
                message: "Start date cannot be later than end date"
            });
            return;
        }

        const expenses = await getUserExpenses(
            req.user!.userId,
            {
                categoryId,
                startDate: parsedStartDate,
                endDate: parsedEndDate
            }
        );

        res.status(200).json({
            success: true,
            count: expenses.length,
            expenses
        });

    } catch (error) {
        console.error("Get expenses error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve expenses"
        });
    }
};

// Update an expense
export const editExpense = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const expenseId = String(req.params.expenseId);

        if (!mongoose.Types.ObjectId.isValid(expenseId)) {
            res.status(400).json({
                success: false,
                message: "Invalid expense ID"
            });
            return;
        }

        const { title, amount, date, categoryId } = req.body;

        // At least one field must be provided
        if (
            title === undefined &&
            amount === undefined &&
            date === undefined &&
            categoryId === undefined
        ) {
            res.status(400).json({
                success: false,
                message: "Please provide at least one field to update"
            });
            return;
        }

        const updateData: {
            title?: string;
            amount?: number;
            date?: Date;
            categoryId?: string;
        } = {};

        if (title !== undefined) {
            if (
                typeof title !== "string" ||
                !title.trim() ||
                title.trim().length > 100
            ) {
                res.status(400).json({
                    success: false,
                    message: "Title must be between 1 and 100 characters"
                });
                return;
            }

            updateData.title = title.trim();
        }

        if (amount !== undefined) {
            if (
                typeof amount !== "number" ||
                !Number.isFinite(amount) ||
                amount <= 0
            ) {
                res.status(400).json({
                    success: false,
                    message: "Amount must be a valid number greater than zero"
                });
                return;
            }

            updateData.amount = amount;
        }

        if (date !== undefined) {
            const expenseDate = new Date(date);

            if (
                typeof date !== "string" ||
                Number.isNaN(expenseDate.getTime())
            ) {
                res.status(400).json({
                    success: false,
                    message: "Please provide a valid date"
                });
                return;
            }

            updateData.date = expenseDate;
        }

        if (categoryId !== undefined) {
            if (
                typeof categoryId !== "string" ||
                !mongoose.Types.ObjectId.isValid(categoryId)
            ) {
                res.status(400).json({
                    success: false,
                    message: "Invalid category ID"
                });
                return;
            }

            updateData.categoryId = categoryId;
        }

        const expense = await updateExpense(
            req.user!.userId,
            expenseId,
            updateData
        );

        if (!expense) {
            res.status(404).json({
                success: false,
                message: "Expense not found, or the selected category is unavailable"
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Expense updated successfully",
            expense
        });

    } catch (error) {
        console.error("Update expense error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update expense"
        });
    }
};

// Delete an expense
export const removeExpense = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const expenseId = String(req.params.expenseId);

        if (!mongoose.Types.ObjectId.isValid(expenseId)) {
            res.status(400).json({
                success: false,
                message: "Invalid expense ID"
            });
            return;
        }

        const expense = await deleteExpense(
            req.user!.userId,
            expenseId
        );

        if (!expense) {
            res.status(404).json({
                success: false,
                message: "Expense not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Expense deleted successfully"
        });

    } catch (error) {
        console.error("Delete expense error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete expense"
        });
    }
};
