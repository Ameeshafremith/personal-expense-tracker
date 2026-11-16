
import Transaction from "../models/transaction.model.js";

export const getMonthlyExpenseCalendar = async (
    userId: string,
    month: number,
    year: number
) => {
    if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12 ||
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 2100
    ) {
        throw new Error("Please provide a valid month and year");
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const dailyExpenses = await Transaction.aggregate([
        {
            $match: {
                userId: new (await import("mongoose")).default.Types.ObjectId(userId),
                type: "expense",
                date: {
                    $gte: startDate,
                    $lt: endDate
                }
            }
        },
        {
            $group: {
                _id: {
                    $dayOfMonth: "$date"
                },
                totalSpent: { $sum: "$amount" },
                expenseCount: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    const daysInMonth = new Date(year, month, 0).getDate();

    const calendar = Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const expense = dailyExpenses.find(
            (item) => item._id === day
        );

        return {
            day,
            date: new Date(Date.UTC(year, month - 1, day)),
            totalSpent: expense?.totalSpent || 0,
            expenseCount: expense?.expenseCount || 0,
            hasExpenses: Boolean(expense)
        };
    });

    const monthlyTotal = calendar.reduce(
        (total, day) => total + day.totalSpent,
        0
    );

    return {
        month,
        year,
        daysInMonth,
        monthlyTotal,
        totalExpenseDays: calendar.filter(day => day.hasExpenses).length,
        calendar
    };
};
