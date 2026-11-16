
import { Request, Response } from "express";
import {
    createIncome,
    getIncomes,
    getIncomeById,
    receiveIncome
} from "../services/income.service.js";

const getErrorStatus = (message: string) => {
    if (message.includes("not found")) return 404;

    if (
        message.includes("Invalid") ||
        message.includes("required") ||
        message.includes("must") ||
        message.includes("already") ||
        message.includes("cannot") ||
        message.includes("only")
    ) {
        return 400;
    }

    return 500;
};

// Create expected income
export const addIncome = async (req: Request, res: Response) => {
    try {
        const {
            title,
            amount,
            frequency,
            walletId,
            expectedDate,
            description
        } = req.body;

        if (
            !title ||
            amount === undefined ||
            !frequency ||
            !walletId ||
            !expectedDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Title, amount, frequency, wallet and expected date are required"
            });
        }

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than zero"
            });
        }

        if (!["one_time", "monthly"].includes(frequency)) {
            return res.status(400).json({
                success: false,
                message: "Frequency must be one_time or monthly"
            });
        }

        if (Number.isNaN(Date.parse(expectedDate))) {
            return res.status(400).json({
                success: false,
                message: "Invalid expected date"
            });
        }

        const income = await createIncome(req.user!.userId, {
            title,
            amount: numericAmount,
            frequency,
            walletId,
            expectedDate: new Date(expectedDate),
            description
        });

        return res.status(201).json({
            success: true,
            message: "Expected income created successfully",
            data: income
        });
    } catch (error: any) {
        const message = error.message || "Failed to create income";

        return res.status(getErrorStatus(message)).json({
            success: false,
            message
        });
    }
};

// Get all income records with optional filters
export const getAllIncomes = async (req: Request, res: Response) => {
    try {
        const { status, frequency } = req.query;

        if (status && !["expected", "received"].includes(String(status))) {
            return res.status(400).json({
                success: false,
                message: "Invalid income status filter"
            });
        }

        if (
            frequency &&
            !["one_time", "monthly"].includes(String(frequency))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid income frequency filter"
            });
        }

        const incomes = await getIncomes(req.user!.userId, {
            status: status as "expected" | "received" | undefined,
            frequency: frequency as "one_time" | "monthly" | undefined
        });

        return res.status(200).json({
            success: true,
            count: incomes.length,
            data: incomes
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve income records"
        });
    }
};

// Get one income record
export const getSingleIncome = async (req: Request, res: Response) => {
    try {
        const income = await getIncomeById(
            String(req.params.incomeId),
            req.user!.userId
        );

        if (!income) {
            return res.status(404).json({
                success: false,
                message: "Income record not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: income
        });
    } catch (error: any) {
        const message = error.message || "Failed to retrieve income";

        return res.status(getErrorStatus(message)).json({
            success: false,
            message
        });
    }
};

// Mark expected income as received
export const markIncomeReceived = async (
    req: Request,
    res: Response
) => {
    try {
        const { receivedDate } = req.body;

        if (
            receivedDate &&
            Number.isNaN(Date.parse(receivedDate))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid received date"
            });
        }

        const income = await receiveIncome(
            String(req.params.incomeId),
            req.user!.userId,
            receivedDate ? new Date(receivedDate) : new Date()
        );

        return res.status(200).json({
            success: true,
            message: "Income marked as received successfully",
            data: income
        });
    } catch (error: any) {
        const message = error.message || "Failed to receive income";

        return res.status(getErrorStatus(message)).json({
            success: false,
            message
        });
    }
};
