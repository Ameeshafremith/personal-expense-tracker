
import mongoose, { Types } from "mongoose";
import Income, {
    IncomeFrequency,
    IncomeStatus
} from "../models/income.model.js";
import Wallet from "../models/wallet.model.js";
import Transaction from "../models/transaction.model.js";

interface CreateIncomeData {
    title: string;
    amount: number;
    frequency: IncomeFrequency;
    walletId: string;
    expectedDate: Date;
    description?: string;
}

// Calculate the next monthly payment date.
// Handles months with fewer days, such as January 31 -> February 28/29.
const getNextMonthlyDate = (date: Date): Date => {
    const nextMonth = new Date(date);
    const originalDay = date.getDate();

    nextMonth.setDate(1);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const lastDayOfNextMonth = new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth() + 1,
        0
    ).getDate();

    nextMonth.setDate(Math.min(originalDay, lastDayOfNextMonth));

    return nextMonth;
};

// Create expected income
export const createIncome = async (
    userId: string,
    data: CreateIncomeData
) => {
    if (!data.title?.trim()) {
        throw new Error("Income title is required");
    }

    if (!Number.isFinite(data.amount) || data.amount <= 0) {
        throw new Error("Income amount must be greater than zero");
    }

    if (!["one_time", "monthly"].includes(data.frequency)) {
        throw new Error("Invalid income frequency");
    }

    if (!Types.ObjectId.isValid(data.walletId)) {
        throw new Error("Invalid wallet ID");
    }

    if (
        !data.expectedDate ||
        Number.isNaN(data.expectedDate.getTime())
    ) {
        throw new Error("Valid expected date is required");
    }

    const session = await mongoose.startSession();

    try {
        let createdIncome: any = null;

        await session.withTransaction(async () => {
            const wallet = await Wallet.findOne({
                _id: data.walletId,
                userId
            }).session(session);

            if (!wallet) {
                throw new Error("Wallet not found");
            }

            if (wallet.type === "credit_card") {
                throw new Error(
                    "Income must be assigned to a cash, bank or digital wallet"
                );
            }

            const [income] = await Income.create(
                [{
                    title: data.title.trim(),
                    amount: data.amount,
                    frequency: data.frequency,
                    status: "expected",
                    userId,
                    walletId: data.walletId,
                    expectedDate: data.expectedDate,
                    description: data.description
                }],
                { session }
            );

            createdIncome = income;
        });

        return createdIncome;
    } finally {
        await session.endSession();
    }
};

// Get all income records belonging to the logged-in user
export const getIncomes = async (
    userId: string,
    filters: {
        status?: IncomeStatus;
        frequency?: IncomeFrequency;
    } = {}
) => {
    const query: Record<string, any> = { userId };

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.frequency) {
        query.frequency = filters.frequency;
    }

    return Income.find(query)
        .populate("walletId", "name type")
        .populate("transactionId")
        .sort({ expectedDate: -1 });
};

// Get one income record
export const getIncomeById = async (
    incomeId: string,
    userId: string
) => {
    if (!Types.ObjectId.isValid(incomeId)) {
        throw new Error("Invalid income ID");
    }

    return Income.findOne({
        _id: incomeId,
        userId
    })
        .populate("walletId", "name type")
        .populate("transactionId");
};

// Mark expected income as received
export const receiveIncome = async (
    incomeId: string,
    userId: string,
    receivedDate: Date = new Date()
) => {
    if (!Types.ObjectId.isValid(incomeId)) {
        throw new Error("Invalid income ID");
    }

    if (Number.isNaN(receivedDate.getTime())) {
        throw new Error("Invalid received date");
    }

    const session = await mongoose.startSession();

    try {
        let receivedIncome: any = null;

        await session.withTransaction(async () => {
            const income = await Income.findOne({
                _id: incomeId,
                userId
            }).session(session);

            if (!income) {
                throw new Error("Income record not found");
            }

            if (income.status === "received") {
                throw new Error("This income has already been received");
            }

            const wallet = await Wallet.findOne({
                _id: income.walletId,
                userId
            }).session(session);

            if (!wallet) {
                throw new Error("Income wallet not found");
            }

            if (wallet.type === "credit_card") {
                throw new Error(
                    "Income cannot be received into a credit card wallet"
                );
            }

            // Add received income to the wallet
            wallet.currentBalance += income.amount;
            await wallet.save({ session });

            // Create the corresponding income transaction
            const [transaction] = await Transaction.create(
                [{
                    title: income.title,
                    type: "income",
                    amount: income.amount,
                    userId,
                    walletId: income.walletId,
                    description: income.description,
                    date: receivedDate
                }],
                { session }
            );

            // Update income status
            income.status = "received";
            income.receivedDate = receivedDate;
            income.transactionId = transaction._id;

            await income.save({ session });

            // Schedule the next expected monthly payment
            if (income.frequency === "monthly") {
                const nextExpectedDate = getNextMonthlyDate(
                    income.expectedDate
                );

                await Income.create(
                    [{
                        title: income.title,
                        amount: income.amount,
                        frequency: "monthly",
                        status: "expected",
                        userId,
                        walletId: income.walletId,
                        expectedDate: nextExpectedDate,
                        description: income.description
                    }],
                    { session }
                );
            }

            receivedIncome = income;
        });

        return receivedIncome;
    } finally {
        await session.endSession();
    }
};
