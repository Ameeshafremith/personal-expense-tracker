
import { Types } from "mongoose";
import Expense from "../models/expense.model.js";

// Get dashboard statistics for the logged-in user
export const getDashboardSummary = async (userId: string) => {
    const userObjectId = new Types.ObjectId(userId);

    // Calculate total spending
    const totalResult = await Expense.aggregate([
        {
            $match: { userId: userObjectId }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]);

    const totalAmount = totalResult[0]?.totalAmount ?? 0;

    // Count all expenses
    const expenseCount = await Expense.countDocuments({
        userId: userObjectId
    });

    // Calculate spending and expense count by category
    const categoryStats = await Expense.aggregate([
        {
            $match: { userId: userObjectId }
        },
        {
            $group: {
                _id: "$categoryId",
                expenseCount: { $sum: 1 },
                totalAmount: { $sum: "$amount" }
            }
        },
        {
            $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $unwind: "$category"
        },
        {
            $project: {
                _id: 0,
                categoryId: "$_id",
                categoryName: "$category.name",
                expenseCount: 1,
                totalAmount: 1
            }
        },
        {
            $sort: { expenseCount: -1 as const }
        }
    ]);

    // Find the most frequently used category
    const mostUsedCategory = categoryStats.length > 0
        ? {
            name: categoryStats[0].categoryName,
            expenseCount: categoryStats[0].expenseCount
        }
        : null;

    // Get the five most recent expenses
    const recentExpenses = await Expense.find({
        userId: userObjectId
    })
        .populate("categoryId", "name")
        .sort({ date: -1 })
        .limit(5);

    return {
        totalAmount,
        expenseCount,
        mostUsedCategory,
        categoryStats,
        recentExpenses
    };
};
