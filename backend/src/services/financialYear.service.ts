
import { Types } from "mongoose";
import Transaction from "../models/transaction.model.js";
import SavingsContribution from "../models/savingsContribution.model.js";
import Category from "../models/category.model.js";

export const getFinancialYearSummary = async (
    userId: string,
    year: number,
    startMonth: number
) => {
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        throw new Error("Please provide a valid financial year");
    }

    if (
        !Number.isInteger(startMonth) ||
        startMonth < 1 ||
        startMonth > 12
    ) {
        throw new Error("Financial year start month must be between 1 and 12");
    }

    if (!Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
    }

    // End date is exclusive.
    const startDate = new Date(Date.UTC(year, startMonth - 1, 1));
    const endDate = new Date(Date.UTC(year + 1, startMonth - 1, 1));

    const userObjectId = new Types.ObjectId(userId);

    const [
        transactionSummary,
        monthlyTransactions,
        savingsSummary,
        monthlySavings,
        categorySummary
    ] = await Promise.all([

        // Overall income and expenses
        Transaction.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    date: { $gte: startDate, $lt: endDate },
                    type: { $in: ["income", "expense"] }
                }
            },
            {
                $group: {
                    _id: "$type",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]),

        // Monthly income and expenses
        Transaction.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    date: { $gte: startDate, $lt: endDate },
                    type: { $in: ["income", "expense"] }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    income: {
                        $sum: {
                            $cond: [
                                { $eq: ["$type", "income"] },
                                "$amount",
                                0
                            ]
                        }
                    },
                    expenses: {
                        $sum: {
                            $cond: [
                                { $eq: ["$type", "expense"] },
                                "$amount",
                                0
                            ]
                        }
                    },
                    transactionCount: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]),

        // Total savings contributions
        SavingsContribution.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    type: "contribution",
                    date: { $gte: startDate, $lt: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalContributions: { $sum: "$amount" },
                    contributionCount: { $sum: 1 }
                }
            }
        ]),

        // Monthly savings contributions
        SavingsContribution.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    type: "contribution",
                    date: { $gte: startDate, $lt: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]),

        // Highest spending by category
        Transaction.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    type: "expense",
                    date: { $gte: startDate, $lt: endDate }
                }
            },
            {
                $group: {
                    _id: "$categoryId",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { total: -1 }
            }
        ])
    ]);

    const income =
        transactionSummary.find((item) => item._id === "income")?.total || 0;

    const expenses =
        transactionSummary.find((item) => item._id === "expense")?.total || 0;

    const totalSavingsContributions =
        savingsSummary[0]?.totalContributions || 0;

    // Resolve category names
    const categoryIds = categorySummary
        .map((item) => item._id)
        .filter((id) => id !== null);

    const categories = await Category.find({
        _id: { $in: categoryIds },
        userId: userObjectId
    })
        .select("name")
        .lean();

    const categoryNames = new Map(
        categories.map((category) => [
            String(category._id),
            category.name
        ])
    );

    const highestSpendingCategory = categorySummary.length > 0
        ? {
            categoryId: categorySummary[0]._id,
            categoryName: categorySummary[0]._id
                ? categoryNames.get(String(categorySummary[0]._id)) || "Unknown Category"
                : "Uncategorized",
            amount: categorySummary[0].total,
            transactionCount: categorySummary[0].count
        }
        : {
            categoryId: null,
            categoryName: "None",
            amount: 0,
            transactionCount: 0
        };

    // Generate all 12 financial-year months
    const monthlyBreakdown = Array.from(
        { length: 12 },
        (_, index) => {
            const monthDate = new Date(
                Date.UTC(year, startMonth - 1 + index, 1)
            );

            const calendarYear = monthDate.getUTCFullYear();
            const calendarMonth = monthDate.getUTCMonth() + 1;

            const transactionRecord = monthlyTransactions.find(
                (item) =>
                    item._id.year === calendarYear &&
                    item._id.month === calendarMonth
            );

            const savingsRecord = monthlySavings.find(
                (item) =>
                    item._id.year === calendarYear &&
                    item._id.month === calendarMonth
            );

            const monthlyIncome = transactionRecord?.income || 0;
            const monthlyExpenses = transactionRecord?.expenses || 0;

            return {
                year: calendarYear,
                month: calendarMonth,
                monthName: monthDate.toLocaleString("en-US", {
                    month: "long",
                    timeZone: "UTC"
                }),
                income: monthlyIncome,
                expenses: monthlyExpenses,
                net: monthlyIncome - monthlyExpenses,
                savingsContributions: savingsRecord?.total || 0,
                transactionCount: transactionRecord?.transactionCount || 0,
                contributionCount: savingsRecord?.count || 0
            };
        }
    );

    // Identify the month with the highest expenses
    const highestSpendingMonth = [...monthlyBreakdown].sort(
        (a, b) => b.expenses - a.expenses
    )[0];

    return {
        financialYear: {
            startYear: year,
            endYear: startMonth === 1
                ? year
                : endDate.getUTCFullYear(),
            startMonth,
            startDate,
            endDate
        },

        totals: {
            income,
            expenses,
            netIncome: income - expenses,
            totalSavingsContributions,
            incomeCount:
                transactionSummary.find((item) => item._id === "income")?.count || 0,
            expenseCount:
                transactionSummary.find((item) => item._id === "expense")?.count || 0,
            contributionCount:
                savingsSummary[0]?.contributionCount || 0
        },

        highestSpendingCategory,
        highestSpendingMonth: {
            year: highestSpendingMonth.year,
            month: highestSpendingMonth.month,
            monthName: highestSpendingMonth.monthName,
            amount: highestSpendingMonth.expenses
        },

        monthlyBreakdown
    };
};
