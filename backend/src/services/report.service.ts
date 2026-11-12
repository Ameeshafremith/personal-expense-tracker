
import Expense from "../models/expense.model.js";

interface ReportFilters {
    startDate: Date;
    endDate: Date;
}

// Retrieve expenses for a user's PDF report
export const getExpenseReportData = async (
    userId: string,
    filters: ReportFilters
) => {
    const expenses = await Expense.find({
        userId,
        date: {
            $gte: filters.startDate,
            $lte: filters.endDate
        }
    })
        .populate<{ categoryId: { name: string } }>(
            "categoryId",
            "name"
        )
        .sort({ date: 1 });

    const totalAmount = expenses.reduce(
        (total, expense) => total + expense.amount,
        0
    );

    return {
        expenses,
        totalAmount,
        expenseCount: expenses.length
    };
};
