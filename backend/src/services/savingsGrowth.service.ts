import { Types } from "mongoose";
import SavingsGoal from "../models/savingsGoal.model.js";
import SavingsContribution from "../models/savingsContribution.model.js";

export const getSavingsGrowth = async (
    userId: string,
    year: number
) => {
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        throw new Error("Invalid year");
    }

    const objectUserId = new Types.ObjectId(userId);

    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year + 1, 0, 1));

    const [goals, movements] = await Promise.all([
        SavingsGoal.find({ userId }).select("savedAmount"),

        SavingsContribution.aggregate([
            {
                $match: {
                    userId: objectUserId,
                    date: {
                        $gte: startDate,
                        $lt: endDate
                    }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$date" },
                        type: "$type"
                    },
                    total: { $sum: "$amount" }
                }
            }
        ])
    ]);

    const currentSavings = goals.reduce(
        (total, goal) => total + goal.savedAmount,
        0
    );

    const monthlyHistory = Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;

        const contributions = movements.find(
            (item) => item._id.month === month &&
                item._id.type === "contribution"
        )?.total ?? 0;

        const withdrawals = movements.find(
            (item) => item._id.month === month &&
                item._id.type === "withdrawal"
        )?.total ?? 0;

        return {
            month,
            contributions,
            withdrawals,
            netGrowth: contributions - withdrawals
        };
    });

    const totalContributions = monthlyHistory.reduce(
        (total, item) => total + item.contributions,
        0
    );

    const totalWithdrawals = monthlyHistory.reduce(
        (total, item) => total + item.withdrawals,
        0
    );

    return {
        year,
        currentSavings,
        totalContributions,
        totalWithdrawals,
        netGrowth: totalContributions - totalWithdrawals,
        monthlyHistory
    };
};