
import { Request, Response } from "express";
import {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
} from "../services/transaction.service.js";

const validTypes = ["income", "expense", "transfer"];

const getErrorStatus = (message: string) => {
    if (message.includes("not found")) return 404;

    if (
        message.includes("Invalid") ||
        message.includes("required") ||
        message.includes("must") ||
        message.includes("exceeded") ||
        message.includes("Insufficient") ||
        message.includes("different") ||
        message.includes("only allowed") ||
        message.includes("Cannot")
    ) {
        return 400;
    }

    return 500;
};

// Create transaction
export const addTransaction = async (req: Request, res: Response) => {
    try {
        const {
            title, type, amount, walletId,
            destinationWalletId, categoryId, description, date
        } = req.body;

        if (!title || !type || amount === undefined || !walletId) {
            return res.status(400).json({
                success: false,
                message: "Title, type, amount and wallet are required"
            });
        }

        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction type"
            });
        }

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than zero"
            });
        }

        if (date && Number.isNaN(Date.parse(date))) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction date"
            });
        }

        const transaction = await createTransaction(
            req.user!.userId,
            {
                title,
                type,
                amount: numericAmount,
                walletId,
                destinationWalletId,
                categoryId,
                description,
                date: date ? new Date(date) : undefined
            }
        );

        return res.status(201).json({
            success: true,
            message: "Transaction created successfully",
            data: transaction
        });
    } catch (error: any) {
        const message = error.message || "Failed to create transaction";

        return res.status(getErrorStatus(message)).json({
            success: false,
            message
        });
    }
};

// Get all transactions with optional filters
export const getAllTransactions = async (
    req: Request,
    res: Response
) => {
    try {
        const { type, walletId, categoryId, startDate, endDate } =
            req.query;

        if (type && !validTypes.includes(String(type))) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction type filter"
            });
        }

        if (startDate && Number.isNaN(Date.parse(String(startDate)))) {
            return res.status(400).json({
                success: false,
                message: "Invalid start date"
            });
        }

        if (endDate && Number.isNaN(Date.parse(String(endDate)))) {
            return res.status(400).json({
                success: false,
                message: "Invalid end date"
            });
        }

        const filters: {
            type?: "income" | "expense" | "transfer";
            walletId?: string;
            categoryId?: string;
            startDate?: Date;
            endDate?: Date;
        } = {};

        if (type) {
            filters.type = String(type) as
                "income" | "expense" | "transfer";
        }

        if (walletId) filters.walletId = String(walletId);
        if (categoryId) filters.categoryId = String(categoryId);
        if (startDate) filters.startDate = new Date(String(startDate));
        if (endDate) filters.endDate = new Date(String(endDate));

        if (
            filters.startDate &&
            filters.endDate &&
            filters.startDate > filters.endDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Start date cannot be after end date"
            });
        }

        const transactions = await getTransactions(
            req.user!.userId,
            filters
        );

        return res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve transactions"
        });
    }
};

// Get transaction by ID
export const getSingleTransaction = async (
    req: Request,
    res: Response
) => {
    try {
        const transaction = await getTransactionById(
            String(req.params.transactionId),
            req.user!.userId
        );

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (error: any) {
        const message = error.message || "Failed to retrieve transaction";

        return res.status(getErrorStatus(message)).json({
            success: false,
            message
        });
    }
};

// Update transaction
export const editTransaction = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            title, type, amount, walletId,
            destinationWalletId, categoryId, description, date
        } = req.body;

        if (!title || !type || amount === undefined || !walletId) {
            return res.status(400).json({
                success: false,
                message: "Title, type, amount and wallet are required"
            });
        }

        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction type"
            });
        }

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than zero"
            });
        }

        if (date && Number.isNaN(Date.parse(date))) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction date"
            });
        }

        const transaction = await updateTransaction(
            String(req.params.transactionId),
            req.user!.userId,
            {
                title,
                type,
                amount: numericAmount,
                walletId,
                destinationWalletId,
                categoryId,
                description,
                date: date ? new Date(date) : undefined
            }
        );

        return res.status(200).json({
            success: true,
            message: "Transaction updated successfully",
            data: transaction
        });
    } catch (error: any) {
        const message = error.message || "Failed to update transaction";

        return res.status(getErrorStatus(message)).json({
            success: false,
            message
        });
    }
};

// Delete transaction
export const removeTransaction = async (
    req: Request,
    res: Response
) => {
    try {
        const transaction = await deleteTransaction(
            String(req.params.transactionId),
            req.user!.userId
        );

        return res.status(200).json({
            success: true,
            message: "Transaction deleted successfully",
            data: transaction
        });
    } catch (error: any) {
        const message = error.message || "Failed to delete transaction";

        return res.status(getErrorStatus(message)).json({
            success: false,
            message
        });
    }
};
