
import Transaction from "../models/transaction.model.js";

interface ReportFilters {
    startDate: Date;
    endDate: Date;
}

// Retrieve expense transactions for a user's PDF report
export const getExpenseReportData = async (
    userId: string,
    filters: ReportFilters
) => {
    const expenses = await Transaction.find({
        userId,
        type: "expense",
        date: {
            $gte: filters.startDate,
            $lte: filters.endDate,
        },
    })
        .populate<{ categoryId: { name: string } | null }>(
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
        expenseCount: expenses.length,
    };
};
