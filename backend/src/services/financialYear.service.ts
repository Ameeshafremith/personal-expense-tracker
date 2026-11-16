
import { Types } from "mongoose";
import Transaction from "../models/transaction.model.js";
import SavingsContribution from "../models/savingsContribution.model.js";

export const getFinancialYearSummary = async (
    userId: string,
    year: number,
    startMonth: number
) => {
    if (
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 2100
    ) {
        throw new Error("Please provide a valid financial year");
    }

    if (
        !Number.isInteger(startMonth) ||
        startMonth < 1 ||
        startMonth > 12
    ) {
        throw new Error("Financial year start month must be between 1 and 12");
    }

    const startDate = new Date(Date.UTC(year, startMonth - 1, 1));
    const endDate = new Date(Date.UTC(year + 1, startMonth - 1, 1));

    const userObjectId = new Types.ObjectId(userId);

    const [transactionSummary, monthlyTransactions, savingsSummary] =
        await Promise.all([
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
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]),

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
            ])
        ]);

    const income = transactionSummary.find(
        (item) => item._id === "income"
    )?.total || 0;

    const expenses = transactionSummary.find(
        (item) => item._id === "expense"
    )?.total || 0;

    const totalSavingsContributions =
        savingsSummary[0]?.totalContributions || 0;

    const monthlyBreakdown = Array.from({ length: 12 }, (_, index) => {
        const monthDate = new Date(
            Date.UTC(year, startMonth - 1 + index, 1)
        );

        const calendarYear = monthDate.getUTCFullYear();
        const calendarMonth = monthDate.getUTCMonth() + 1;

        const record = monthlyTransactions.find(
            (item) =>
                item._id.year === calendarYear &&
                item._id.month === calendarMonth
        );

        return {
            year: calendarYear,
            month: calendarMonth,
            income: record?.income || 0,
            expenses: record?.expenses || 0,
            net: (record?.income || 0) - (record?.expenses || 0),
            transactionCount: record?.transactionCount || 0
        };
    });

    return {
        financialYear: {
            startYear: year,
            endYear: endDate.getUTCFullYear(),
            startMonth,
            startDate,
            endDate
        },
        totals: {
            income,
            expenses,
            netIncome: income - expenses,
            totalSavingsContributions
        },
        monthlyBreakdown
    };
};
