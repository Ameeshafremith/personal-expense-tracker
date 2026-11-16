
import mongoose, { Types } from "mongoose";
import SavingsGoal from "../models/savingsGoal.model.js";
import SavingsContribution from "../models/savingsContribution.model.js";
import Wallet from "../models/wallet.model.js";

interface SavingsGoalData {
    name: string;
    description?: string;
    targetAmount: number;
    targetDate?: Date;
}

interface SavingsMovementData {
    goalId: string;
    walletId: string;
    amount: number;
    type: "contribution" | "withdrawal";
    date?: Date;
    description?: string;
}

export const createSavingsGoal = async (
    userId: string,
    data: SavingsGoalData
) => {
    if (!data.name?.trim()) {
        throw new Error("Savings goal name is required");
    }

    if (!Number.isFinite(data.targetAmount) || data.targetAmount <= 0) {
        throw new Error("Target amount must be greater than zero");
    }

    if (data.targetDate && new Date(data.targetDate) < new Date("2000-01-01")) {
        throw new Error("Invalid target date");
    }

    return SavingsGoal.create({
        name: data.name,
        description: data.description,
        targetAmount: data.targetAmount,
        targetDate: data.targetDate,
        userId
    });
};

export const getSavingsGoals = async (userId: string) => {
    const goals = await SavingsGoal.find({ userId }).sort({ createdAt: -1 });

    return goals.map((goal) => ({
        ...goal.toObject(),
        remainingAmount: Math.max(0, goal.targetAmount - goal.savedAmount),
        progressPercentage: Math.min(
            100,
            Number(((goal.savedAmount / goal.targetAmount) * 100).toFixed(2))
        )
    }));
};

export const getSavingsGoalById = async (
    goalId: string,
    userId: string
) => {
    if (!Types.ObjectId.isValid(goalId)) {
        throw new Error("Invalid savings goal ID");
    }

    const goal = await SavingsGoal.findOne({ _id: goalId, userId });

    if (!goal) {
        throw new Error("Savings goal not found");
    }

    return {
        ...goal.toObject(),
        remainingAmount: Math.max(0, goal.targetAmount - goal.savedAmount),
        progressPercentage: Math.min(
            100,
            Number(((goal.savedAmount / goal.targetAmount) * 100).toFixed(2))
        )
    };
};

export const updateSavingsGoal = async (
    goalId: string,
    userId: string,
    data: Partial<SavingsGoalData> & { status?: "active" | "completed" | "paused" }
) => {
    if (!Types.ObjectId.isValid(goalId)) {
        throw new Error("Invalid savings goal ID");
    }

    const allowedStatuses = ["active", "completed", "paused"];

    if (data.status && !allowedStatuses.includes(data.status)) {
        throw new Error("Invalid savings goal status");
    }

    if (
        data.targetAmount !== undefined &&
        (!Number.isFinite(data.targetAmount) || data.targetAmount <= 0)
    ) {
        throw new Error("Target amount must be greater than zero");
    }

    const goal = await SavingsGoal.findOneAndUpdate(
        { _id: goalId, userId },
        { $set: data },
        { new: true, runValidators: true }
    );

    if (!goal) {
        throw new Error("Savings goal not found");
    }

    return goal;
};

export const deleteSavingsGoal = async (
    goalId: string,
    userId: string
) => {
    if (!Types.ObjectId.isValid(goalId)) {
        throw new Error("Invalid savings goal ID");
    }

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const goal = await SavingsGoal.findOne({
                _id: goalId,
                userId
            }).session(session);

            if (!goal) {
                throw new Error("Savings goal not found");
            }

            const contributionCount = await SavingsContribution.countDocuments({
                goalId,
                userId
            }).session(session);

            if (contributionCount > 0) {
                throw new Error(
                    "Cannot delete a savings goal with contribution history"
                );
            }

            await goal.deleteOne({ session });
        });

        return { message: "Savings goal deleted successfully" };
    } finally {
        await session.endSession();
    }
};

export const recordSavingsMovement = async (
    userId: string,
    data: SavingsMovementData
) => {
    if (
        !Types.ObjectId.isValid(data.goalId) ||
        !Types.ObjectId.isValid(data.walletId)
    ) {
        throw new Error("Invalid savings goal or wallet ID");
    }

    if (!Number.isFinite(data.amount) || data.amount <= 0) {
        throw new Error("Amount must be greater than zero");
    }

    if (!["contribution", "withdrawal"].includes(data.type)) {
        throw new Error("Invalid savings movement type");
    }

    const session = await mongoose.startSession();

    try {
        let savedMovement: any;

        await session.withTransaction(async () => {
            const goal = await SavingsGoal.findOne({
                _id: data.goalId,
                userId
            }).session(session);

            if (!goal) {
                throw new Error("Savings goal not found");
            }

            const wallet = await Wallet.findOne({
                _id: data.walletId,
                userId
            }).session(session);

            if (!wallet) {
                throw new Error("Wallet not found");
            }

            if (wallet.type === "credit_card") {
                throw new Error("Credit cards cannot be used for savings");
            }

            if (data.type === "contribution") {
                if (wallet.currentBalance < data.amount) {
                    throw new Error("Insufficient wallet balance");
                }

                wallet.currentBalance -= data.amount;
                goal.savedAmount += data.amount;
            } else {
                if (goal.savedAmount < data.amount) {
                    throw new Error("Withdrawal exceeds saved amount");
                }

                goal.savedAmount -= data.amount;
                wallet.currentBalance += data.amount;
            }

            goal.status =
                goal.savedAmount >= goal.targetAmount
                    ? "completed"
                    : goal.status === "completed"
                        ? "active"
                        : goal.status;

            await wallet.save({ session });
            await goal.save({ session });

            const [movement] = await SavingsContribution.create(
                [{
                    userId,
                    goalId: data.goalId,
                    walletId: data.walletId,
                    type: data.type,
                    amount: data.amount,
                    date: data.date || new Date(),
                    description: data.description
                }],
                { session }
            );

            savedMovement = movement;
        });

        return savedMovement;
    } finally {
        await session.endSession();
    }
};

export const getSavingsHistory = async (
    userId: string,
    goalId?: string
) => {
    const filter: Record<string, unknown> = { userId };

    if (goalId) {
        if (!Types.ObjectId.isValid(goalId)) {
            throw new Error("Invalid savings goal ID");
        }

        filter.goalId = goalId;
    }

    return SavingsContribution.find(filter)
        .populate("goalId", "name")
        .populate("walletId", "name type")
        .sort({ date: -1 });
};
