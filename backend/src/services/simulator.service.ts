
import { Types } from "mongoose";
import Wallet from "../models/wallet.model.js";
import Transaction from "../models/transaction.model.js";

export const simulatePurchase = async (
    userId: string,
    purchaseAmount: number,
    purchaseName?: string
) => {
    if (
        !Number.isFinite(purchaseAmount) ||
        purchaseAmount <= 0
    ) {
        throw new Error("Purchase amount must be greater than zero");
    }

    const userObjectId = new Types.ObjectId(userId);

    // Get available money, excluding credit cards.
    const wallets = await Wallet.find({
        userId,
        type: { $ne: "credit_card" }
    });

    const currentAvailableMoney = wallets.reduce(
        (total, wallet) => total + wallet.currentBalance,
        0
    );

    // Calculate income and expenses over the previous 3 calendar months,
    // including the current month.
    const now = new Date();
    const periodStart = new Date(
        now.getFullYear(),
        now.getMonth() - 2,
        1
    );

    const financialActivity = await Transaction.aggregate([
        {
            $match: {
                userId: userObjectId,
                type: { $in: ["income", "expense"] },
                date: {
                    $gte: periodStart,
                    $lte: now
                }
            }
        },
        {
            $group: {
                _id: "$type",
                total: { $sum: "$amount" }
            }
        }
    ]);

    const totalIncome =
        financialActivity.find(item => item._id === "income")?.total || 0;

    const totalExpenses =
        financialActivity.find(item => item._id === "expense")?.total || 0;

    const averageMonthlyIncome = totalIncome / 3;
    const averageMonthlyExpenses = totalExpenses / 3;

    const expectedMonthlySavings =
        averageMonthlyIncome - averageMonthlyExpenses;

    const remainingAmount = Math.max(
        0,
        purchaseAmount - currentAvailableMoney
    );

    let estimatedMonths = 0;
    let estimatedPurchaseDate: Date | null = null;
    let canAffordNow = remainingAmount === 0;
    let affordableInFuture = false;

    if (canAffordNow) {
        estimatedPurchaseDate = now;
    } else if (expectedMonthlySavings > 0) {
        estimatedMonths = Math.ceil(
            remainingAmount / expectedMonthlySavings
        );

        const estimatedDate = new Date(
            now.getFullYear(),
            now.getMonth() + estimatedMonths,
            now.getDate()
        );

        estimatedPurchaseDate = estimatedDate;
        affordableInFuture = true;
    }

    return {
        purchaseName: purchaseName || "Planned Purchase",
        purchaseAmount,
        currentAvailableMoney,
        remainingAmount,
        averageMonthlyIncome: Number(averageMonthlyIncome.toFixed(2)),
        averageMonthlyExpenses: Number(averageMonthlyExpenses.toFixed(2)),
        expectedMonthlySavings: Number(expectedMonthlySavings.toFixed(2)),
        estimatedMonths,
        estimatedPurchaseDate,
        canAffordNow,
        affordableInFuture,
        message: canAffordNow
            ? "You currently have enough available money for this purchase."
            : affordableInFuture
                ? `You may be able to afford this purchase in approximately ${estimatedMonths} month(s).`
                : "Based on recent activity, your average monthly savings are not positive enough to estimate a purchase date."
    };
};
