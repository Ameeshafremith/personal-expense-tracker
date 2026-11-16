
import mongoose, { Types } from "mongoose";
import Transaction, {
    TransactionType
} from "../models/transaction.model.js";
import Wallet from "../models/wallet.model.js";
import Category from "../models/category.model.js";
import { adjustEnvelopeSpending } from "./envelope.service.js";

interface TransactionData {
    title: string;
    type: TransactionType;
    amount: number;
    walletId: string;
    destinationWalletId?: string;
    categoryId?: string;
    description?: string;
    date?: Date;
}

interface TransactionFilters {
    type?: TransactionType;
    walletId?: string;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
}

// Validate transaction details
const validateTransactionData = (data: TransactionData) => {
    if (!Types.ObjectId.isValid(data.walletId)) {
        throw new Error("Invalid wallet ID");
    }

    if (
        data.destinationWalletId &&
        !Types.ObjectId.isValid(data.destinationWalletId)
    ) {
        throw new Error("Invalid destination wallet ID");
    }

    if (!Number.isFinite(data.amount) || data.amount <= 0) {
        throw new Error("Amount must be greater than zero");
    }

    if (!["income", "expense", "transfer"].includes(data.type)) {
        throw new Error("Invalid transaction type");
    }

    if (!data.title?.trim()) {
        throw new Error("Transaction title is required");
    }

    if (data.type === "transfer" && !data.destinationWalletId) {
        throw new Error("Destination wallet is required for transfers");
    }

    if (data.type !== "transfer" && data.destinationWalletId) {
        throw new Error("Destination wallet is only allowed for transfers");
    }

    if (
        data.type === "transfer" &&
        data.walletId === data.destinationWalletId
    ) {
        throw new Error("Source and destination wallets must be different");
    }

    if (data.categoryId && !Types.ObjectId.isValid(data.categoryId)) {
        throw new Error("Invalid category ID");
    }

    if (data.date && Number.isNaN(data.date.getTime())) {
        throw new Error("Invalid transaction date");
    }
};

// Get a wallet belonging to the current user
const getUserWallet = async (
    walletId: string,
    userId: string,
    session: mongoose.ClientSession
) => {
    const wallet = await Wallet.findOne({
        _id: walletId,
        userId
    }).session(session);

    if (!wallet) {
        throw new Error("Wallet not found");
    }

    return wallet;
};

// Validate category ownership
const validateCategory = async (
    categoryId: string | undefined,
    userId: string,
    session: mongoose.ClientSession
) => {
    if (!categoryId) return;

    const category = await Category.findOne({
        _id: categoryId,
        userId
    }).session(session);

    if (!category) {
        throw new Error("Category not found");
    }
};

// Reverse a transaction's previous effects
const reverseTransactionEffect = async (
    type: TransactionType,
    amount: number,
    sourceWallet: any,
    userId: string,
    categoryId: Types.ObjectId | undefined,
    date: Date,
    session: mongoose.ClientSession,
    destinationWallet?: any
) => {
    if (type === "income") {
        if (sourceWallet.type === "credit_card") {
            sourceWallet.outstandingBalance =
                (sourceWallet.outstandingBalance || 0) + amount;

            if (
                sourceWallet.creditLimit !== undefined &&
                sourceWallet.outstandingBalance > sourceWallet.creditLimit
            ) {
                throw new Error(
                    "Cannot reverse this refund because it would exceed the credit limit"
                );
            }
        } else {
            if (sourceWallet.currentBalance < amount) {
                throw new Error(
                    "Cannot reverse this income because the wallet balance is insufficient"
                );
            }

            sourceWallet.currentBalance -= amount;
        }
    }

    if (type === "expense") {
        if (sourceWallet.type === "credit_card") {
            if ((sourceWallet.outstandingBalance || 0) < amount) {
                throw new Error(
                    "Cannot reverse this expense because the outstanding balance is insufficient"
                );
            }

            sourceWallet.outstandingBalance -= amount;
        } else {
            sourceWallet.currentBalance += amount;
        }

        // Reverse the old envelope spending
        if (categoryId) {
            await adjustEnvelopeSpending(
                userId,
                categoryId,
                date,
                -amount,
                session
            );
        }
    }

    if (type === "transfer" && destinationWallet) {
        if (destinationWallet.currentBalance < amount) {
            throw new Error(
                "Cannot reverse this transfer because the destination wallet has insufficient funds"
            );
        }

        sourceWallet.currentBalance += amount;
        destinationWallet.currentBalance -= amount;
    }
};

// Apply a transaction's effects
const applyTransactionEffect = async (
    type: TransactionType,
    amount: number,
    sourceWallet: any,
    userId: string,
    categoryId: Types.ObjectId | undefined,
    date: Date,
    session: mongoose.ClientSession,
    destinationWallet?: any
) => {
    if (type === "income") {
        if (sourceWallet.type === "credit_card") {
            if ((sourceWallet.outstandingBalance || 0) < amount) {
                throw new Error(
                    "Refund amount cannot exceed outstanding card balance"
                );
            }

            sourceWallet.outstandingBalance -= amount;
        } else {
            sourceWallet.currentBalance += amount;
        }
    }

    if (type === "expense") {
        if (sourceWallet.type === "credit_card") {
            const newOutstanding =
                (sourceWallet.outstandingBalance || 0) + amount;

            if (
                sourceWallet.creditLimit !== undefined &&
                newOutstanding > sourceWallet.creditLimit
            ) {
                throw new Error("Credit limit exceeded");
            }

            sourceWallet.outstandingBalance = newOutstanding;
        } else {
            if (sourceWallet.currentBalance < amount) {
                throw new Error("Insufficient wallet balance");
            }

            sourceWallet.currentBalance -= amount;
        }

        // Update the corresponding envelope spending
        if (categoryId) {
            await adjustEnvelopeSpending(
                userId,
                categoryId,
                date,
                amount,
                session
            );
        }
    }

    if (type === "transfer" && destinationWallet) {
        if (
            sourceWallet.type === "credit_card" ||
            destinationWallet.type === "credit_card"
        ) {
            throw new Error(
                "Transfers are only allowed between non-credit wallets"
            );
        }

        if (sourceWallet.currentBalance < amount) {
            throw new Error("Insufficient wallet balance");
        }

        sourceWallet.currentBalance -= amount;
        destinationWallet.currentBalance += amount;
    }
};

// Create income, expense or transfer
export const createTransaction = async (
    userId: string,
    data: TransactionData
) => {
    validateTransactionData(data);

    const session = await mongoose.startSession();

    try {
        let createdTransaction: any = null;

        await session.withTransaction(async () => {
            const sourceWallet = await getUserWallet(
                data.walletId,
                userId,
                session
            );

            const destinationWallet = data.destinationWalletId
                ? await getUserWallet(
                    data.destinationWalletId,
                    userId,
                    session
                )
                : undefined;

            await validateCategory(data.categoryId, userId, session);

            const transactionDate = data.date || new Date();

            await applyTransactionEffect(
                data.type,
                data.amount,
                sourceWallet,
                userId,
                data.categoryId
                    ? new Types.ObjectId(data.categoryId)
                    : undefined,
                transactionDate,
                session,
                destinationWallet
            );

            await sourceWallet.save({ session });

            if (destinationWallet) {
                await destinationWallet.save({ session });
            }

            const [transaction] = await Transaction.create(
                [{
                    title: data.title.trim(),
                    type: data.type,
                    amount: data.amount,
                    userId,
                    walletId: data.walletId,
                    destinationWalletId: data.destinationWalletId || undefined,
                    categoryId: data.categoryId || undefined,
                    description: data.description,
                    date: transactionDate
                }],
                { session }
            );

            createdTransaction = transaction;
        });

        return createdTransaction;
    } finally {
        await session.endSession();
    }
};

// Get all transactions belonging to the logged-in user
export const getTransactions = async (
    userId: string,
    filters: TransactionFilters = {}
) => {
    const query: Record<string, any> = { userId };

    if (filters.type) query.type = filters.type;

    if (filters.walletId) {
        query.$or = [
            { walletId: filters.walletId },
            { destinationWalletId: filters.walletId }
        ];
    }

    if (filters.categoryId) {
        query.categoryId = filters.categoryId;
    }

    if (filters.startDate || filters.endDate) {
        query.date = {};

        if (filters.startDate) {
            query.date.$gte = filters.startDate;
        }

        if (filters.endDate) {
            query.date.$lte = filters.endDate;
        }
    }

    return Transaction.find(query)
        .populate("walletId", "name type")
        .populate("destinationWalletId", "name type")
        .populate("categoryId", "name")
        .sort({ date: -1 });
};

// Get one transaction
export const getTransactionById = async (
    transactionId: string,
    userId: string
) => {
    if (!Types.ObjectId.isValid(transactionId)) {
        throw new Error("Invalid transaction ID");
    }

    return Transaction.findOne({
        _id: transactionId,
        userId
    })
        .populate("walletId", "name type")
        .populate("destinationWalletId", "name type")
        .populate("categoryId", "name");
};

// Update an existing transaction
export const updateTransaction = async (
    transactionId: string,
    userId: string,
    data: TransactionData
) => {
    if (!Types.ObjectId.isValid(transactionId)) {
        throw new Error("Invalid transaction ID");
    }

    validateTransactionData(data);

    const session = await mongoose.startSession();

    try {
        let updatedTransaction: any = null;

        await session.withTransaction(async () => {
            const transaction = await Transaction.findOne({
                _id: transactionId,
                userId
            }).session(session);

            if (!transaction) {
                throw new Error("Transaction not found");
            }

            // Load the old wallets
            const oldSourceWallet = await getUserWallet(
                transaction.walletId.toString(),
                userId,
                session
            );

            const oldDestinationWallet = transaction.destinationWalletId
                ? await getUserWallet(
                    transaction.destinationWalletId.toString(),
                    userId,
                    session
                )
                : undefined;

            // Reverse the original wallet and envelope effects
            await reverseTransactionEffect(
                transaction.type,
                transaction.amount,
                oldSourceWallet,
                userId,
                transaction.categoryId
                    ? new Types.ObjectId(transaction.categoryId.toString())
                    : undefined,
                transaction.date,
                session,
                oldDestinationWallet
            );

            // Load the wallets for the updated transaction
            const newSourceWallet =
                data.walletId === transaction.walletId.toString()
                    ? oldSourceWallet
                    : await getUserWallet(data.walletId, userId, session);

            let newDestinationWallet: any = undefined;

            if (data.destinationWalletId) {
                if (
                    data.destinationWalletId ===
                    transaction.walletId.toString()
                ) {
                    newDestinationWallet = oldSourceWallet;
                } else if (
                    data.destinationWalletId ===
                    transaction.destinationWalletId?.toString()
                ) {
                    newDestinationWallet = oldDestinationWallet;
                } else {
                    newDestinationWallet = await getUserWallet(
                        data.destinationWalletId,
                        userId,
                        session
                    );
                }
            }

            await validateCategory(data.categoryId, userId, session);

            const transactionDate = data.date || transaction.date;

            // Apply the updated wallet and envelope effects
            await applyTransactionEffect(
                data.type,
                data.amount,
                newSourceWallet,
                userId,
                data.categoryId
                    ? new Types.ObjectId(data.categoryId)
                    : undefined,
                transactionDate,
                session,
                newDestinationWallet
            );

            // Save affected wallets only once
            const walletsToSave = new Map<string, any>();

            [
                oldSourceWallet,
                oldDestinationWallet,
                newSourceWallet,
                newDestinationWallet
            ].forEach(wallet => {
                if (wallet) {
                    walletsToSave.set(wallet._id.toString(), wallet);
                }
            });

            for (const wallet of walletsToSave.values()) {
                await wallet.save({ session });
            }

            transaction.title = data.title.trim();
            transaction.type = data.type;
            transaction.amount = data.amount;
            transaction.walletId = new Types.ObjectId(data.walletId);
            transaction.destinationWalletId = data.destinationWalletId
                ? new Types.ObjectId(data.destinationWalletId)
                : undefined;
            transaction.categoryId = data.categoryId
                ? new Types.ObjectId(data.categoryId)
                : undefined;
            transaction.description = data.description;
            transaction.date = transactionDate;

            await transaction.save({ session });

            updatedTransaction = transaction;
        });

        return updatedTransaction;
    } finally {
        await session.endSession();
    }
};

// Delete a transaction and reverse its wallet and envelope effects
export const deleteTransaction = async (
    transactionId: string,
    userId: string
) => {
    if (!Types.ObjectId.isValid(transactionId)) {
        throw new Error("Invalid transaction ID");
    }

    const session = await mongoose.startSession();

    try {
        let deletedTransaction: any = null;

        await session.withTransaction(async () => {
            const transaction = await Transaction.findOne({
                _id: transactionId,
                userId
            }).session(session);

            if (!transaction) {
                throw new Error("Transaction not found");
            }

            const sourceWallet = await getUserWallet(
                transaction.walletId.toString(),
                userId,
                session
            );

            const destinationWallet = transaction.destinationWalletId
                ? await getUserWallet(
                    transaction.destinationWalletId.toString(),
                    userId,
                    session
                )
                : undefined;

            await reverseTransactionEffect(
                transaction.type,
                transaction.amount,
                sourceWallet,
                userId,
                transaction.categoryId
                    ? new Types.ObjectId(transaction.categoryId.toString())
                    : undefined,
                transaction.date,
                session,
                destinationWallet
            );

            await sourceWallet.save({ session });

            if (destinationWallet) {
                await destinationWallet.save({ session });
            }

            await transaction.deleteOne({ session });

            deletedTransaction = transaction;
        });

        return deletedTransaction;
    } finally {
        await session.endSession();
    }
};
