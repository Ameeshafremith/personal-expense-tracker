
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


interface ExpenseFilters {
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
}

// Get expenses with optional category and date filters
export const getUserExpenses = async (
    userId: string,
    filters: ExpenseFilters = {}
) => {
    const query: {
        userId: Types.ObjectId;
        categoryId?: Types.ObjectId;
        date?: {
            $gte?: Date;
            $lte?: Date;
        };
    } = {
        userId: new Types.ObjectId(userId)
    };

    // Filter by category
    if (filters.categoryId) {
        query.categoryId = new Types.ObjectId(filters.categoryId);
    }

    // Filter by date range
    if (filters.startDate || filters.endDate) {
        query.date = {};

        if (filters.startDate) {
            query.date.$gte = filters.startDate;
        }

        if (filters.endDate) {
            query.date.$lte = filters.endDate;
        }
    }

    return await Expense.find(query)
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
