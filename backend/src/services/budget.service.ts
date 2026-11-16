
import Budget from "../models/budget.model.js";
import Category from "../models/category.model.js";
import Transaction from "../models/transaction.model.js";
import mongoose, { Types } from "mongoose";

interface CreateBudgetData {
    categoryId: string;
    amount: number;
    month: number;
    year: number;
    rolloverEnabled?: boolean;
}

export const createBudget = async (
    userId: string,
    data: CreateBudgetData
) => {
    const { categoryId, amount, month, year, rolloverEnabled } = data;

    if (!Types.ObjectId.isValid(categoryId)) {
        throw new Error("Invalid category ID");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Budget amount must be greater than zero");
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new Error("Month must be between 1 and 12");
    }

    if (!Number.isInteger(year) || year < 2000) {
        throw new Error("Invalid budget year");
    }

    const category = await Category.findOne({
        _id: categoryId,
        userId
    });

    if (!category) {
        throw new Error("Category not found");
    }

    return Budget.create({
        userId,
        categoryId,
        amount,
        month,
        year,
        rolloverEnabled: rolloverEnabled ?? false,
        rolloverAmount: 0
    });
};

export const getBudgets = async (
    userId: string,
    month: number,
    year: number
) => {
    const budgets = await Budget.find({
        userId,
        month,
        year
    }).populate("categoryId", "name");

    const results = await Promise.all(
        budgets.map(async (budget) => {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 1);

            const spending = await Transaction.aggregate([
                {
                    $match: {
                        userId: new Types.ObjectId(userId),
                        categoryId: budget.categoryId._id,
                        type: "expense",
                        date: {
                            $gte: startDate,
                            $lt: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" }
                    }
                }
            ]);

            const spent = spending[0]?.total ?? 0;
            const available =
                budget.amount + budget.rolloverAmount;
            const remaining = available - spent;

            return {
                ...budget.toObject(),
                spent,
                available,
                remaining,
                exceeded: remaining < 0,
                progressPercentage:
                    available > 0
                        ? Math.round((spent / available) * 100)
                        : 0
            };
        })
    );

    return results;
};

export const updateBudget = async (
    budgetId: string,
    userId: string,
    data: Partial<CreateBudgetData>
) => {
    if (!Types.ObjectId.isValid(budgetId)) {
        throw new Error("Invalid budget ID");
    }

    if (data.categoryId) {
        if (!Types.ObjectId.isValid(data.categoryId)) {
            throw new Error("Invalid category ID");
        }

        const category = await Category.findOne({
            _id: data.categoryId,
            userId
        });

        if (!category) {
            throw new Error("Category not found");
        }
    }

    if (data.amount !== undefined &&
        (!Number.isFinite(data.amount) || data.amount <= 0)) {
        throw new Error("Budget amount must be greater than zero");
    }

    if (data.month !== undefined &&
        (!Number.isInteger(data.month) ||
            data.month < 1 || data.month > 12)) {
        throw new Error("Invalid month");
    }

    if (data.year !== undefined &&
        (!Number.isInteger(data.year) || data.year < 2000)) {
        throw new Error("Invalid year");
    }

    const budget = await Budget.findOneAndUpdate(
        { _id: budgetId, userId },
        data,
        { new: true, runValidators: true }
    );

    if (!budget) {
        throw new Error("Budget not found");
    }

    return budget;
};

export const deleteBudget = async (
    budgetId: string,
    userId: string
) => {
    if (!Types.ObjectId.isValid(budgetId)) {
        throw new Error("Invalid budget ID");
    }

    const budget = await Budget.findOneAndDelete({
        _id: budgetId,
        userId
    });

    if (!budget) {
        throw new Error("Budget not found");
    }

    return budget;
};

export const rolloverBudgets = async (
    userId: string,
    fromMonth: number,
    fromYear: number
) => {
    if (!Number.isInteger(fromMonth) ||
        fromMonth < 1 || fromMonth > 12 ||
        !Number.isInteger(fromYear) || fromYear < 2000) {
        throw new Error("Invalid source month or year");
    }

    const nextMonth = fromMonth === 12 ? 1 : fromMonth + 1;
    const nextYear = fromMonth === 12 ? fromYear + 1 : fromYear;

    const previousBudgets = await getBudgets(
        userId,
        fromMonth,
        fromYear
    );

    const session = await mongoose.startSession();
    let createdCount = 0;

    try {
        await session.withTransaction(async () => {
            for (const previous of previousBudgets) {
                if (!previous.rolloverEnabled) continue;

                const unusedAmount = Math.max(0, previous.remaining);

                const existingNextBudget = await Budget.findOne({
                    userId,
                    categoryId: previous.categoryId._id,
                    month: nextMonth,
                    year: nextYear
                }).session(session);

                if (existingNextBudget) {
                    continue;
                }

                await Budget.create(
                    [{
                        userId,
                        categoryId: previous.categoryId._id,
                        amount: previous.amount,
                        month: nextMonth,
                        year: nextYear,
                        rolloverEnabled: true,
                        rolloverAmount: unusedAmount
                    }],
                    { session }
                );

                createdCount++;
            }
        });
    } finally {
        await session.endSession();
    }

    return {
        message: "Budget rollover completed",
        createdCount,
        nextMonth,
        nextYear
    };
};

export const checkBudgetCollision = async (
    userId: string,
    categoryId: string,
    plannedAmount: number,
    month: number,
    year: number
) => {
    if (!Types.ObjectId.isValid(categoryId)) {
        throw new Error("Invalid category ID");
    }

    if (!Number.isFinite(plannedAmount) || plannedAmount <= 0) {
        throw new Error("Planned amount must be greater than zero");
    }

    if (
        !Number.isInteger(month) || month < 1 || month > 12 ||
        !Number.isInteger(year) || year < 2000 || year > 2100
    ) {
        throw new Error("Invalid month or year");
    }

    const budget = await Budget.findOne({
        userId,
        categoryId,
        month,
        year
    });

    if (!budget) {
        throw new Error("No budget found for this category and month");
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const expenses = await Transaction.find({
        userId,
        categoryId,
        type: "expense",
        date: { $gte: startDate, $lt: endDate }
    }).select("amount");

    const currentSpent = expenses.reduce(
        (total, expense) => total + expense.amount,
        0
    );

    const availableBudget = budget.amount + (budget.rolloverAmount || 0);
    const remainingBudget = availableBudget - currentSpent;
    const projectedSpending = currentSpent + plannedAmount;
    const exceededAmount = Math.max(0, projectedSpending - availableBudget);

    return {
        categoryId,
        month,
        year,
        budgetAmount: budget.amount,
        rolloverAmount: budget.rolloverAmount || 0,
        currentSpent,
        remainingBudget,
        plannedAmount,
        projectedSpending,
        exceededAmount,
        collision: exceededAmount > 0,
        message: exceededAmount > 0
            ? `Warning: This expense would exceed your budget by LKR ${exceededAmount.toFixed(2)}.`
            : "This planned expense is within your remaining budget."
    };
};
