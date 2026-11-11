
import { Types } from "mongoose";
import Expense from "../models/expense.model.js";
import Category from "../models/category.model.js";

interface CreateExpenseData {
    title: string;
    amount: number;
    date: Date;
    categoryId: string;
}

interface UpdateExpenseData {
    title?: string;
    amount?: number;
    date?: Date;
    categoryId?: string;
}

// Create an expense
export const createExpense = async (
    userId: string,
    data: CreateExpenseData
) => {
    // Check whether the category belongs to this user
    const category = await Category.findOne({
        _id: data.categoryId,
        userId
    });

    if (!category) {
        return null;
    }

    return await Expense.create({
        title: data.title,
        amount: data.amount,
        date: data.date,
        categoryId: new Types.ObjectId(data.categoryId),
        userId: new Types.ObjectId(userId)
    });
};

// Get all expenses belonging to a user
export const getUserExpenses = async (userId: string) => {
    return await Expense.find({ userId })
        .populate("categoryId", "name")
        .sort({ date: -1 });
};

// Update an expense
export const updateExpense = async (
    userId: string,
    expenseId: string,
    data: UpdateExpenseData
) => {
    // Verify the new category if one was provided
    if (data.categoryId) {
        const category = await Category.findOne({
            _id: data.categoryId,
            userId
        });

        if (!category) {
            return null;
        }
    }

    return await Expense.findOneAndUpdate(
        {
            _id: expenseId,
            userId
        },
        data,
        {
            new: true,
            runValidators: true
        }
    ).populate("categoryId", "name");
};

// Delete an expense
export const deleteExpense = async (
    userId: string,
    expenseId: string
) => {
    return await Expense.findOneAndDelete({
        _id: expenseId,
        userId
    });
};
