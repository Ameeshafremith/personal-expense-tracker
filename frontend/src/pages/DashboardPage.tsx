
import { useEffect, useState } from "react";
import api from "../services/api";
import { useAppSelector } from "../app/hooks";

interface CategoryStat {
    expenseCount: number;
    totalAmount: number;
    categoryId: string;
    categoryName: string;
}

interface RecentExpense {
    _id: string;
    title: string;
    amount: number;
    date: string;
    categoryId: {
        _id: string;
        name: string;
    };
}

interface DashboardData {
    totalAmount: number;
    expenseCount: number;
    mostUsedCategory: {
        name: string;
        expenseCount: number;
    } | null;
    categoryStats: CategoryStat[];
    recentExpenses: RecentExpense[];
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: "LKR",
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-LK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function DashboardPage() {
    const user = useAppSelector((state) => state.auth.user);

    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get("/dashboard");
                setDashboard(response.data.dashboard);
            } catch (err: any) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load dashboard information."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const glassCard =
        "rounded-3xl border border-white/10 bg-white/[0.055] shadow-[0_8px_32px_rgba(0,0,0,0.20)] backdrop-blur-2xl";

    return (
        <div className="space-y-8">
            {/* Dashboard heading */}
            <section className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-violet-300">
                        OVERVIEW
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                        Dashboard
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Welcome back, {user?.name || "User"}! Here's your financial overview.
                    </p>
                </div>

                <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-slate-300 backdrop-blur-xl">
                    Personal Finance Overview
                </div>
            </section>

            {loading && (
                <div className={`${glassCard} p-10 text-center text-slate-400`}>
                    Loading your dashboard...
                </div>
            )}

            {!loading && error && (
                <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-300 backdrop-blur-xl">
                    <p className="font-semibold">Dashboard could not load</p>
                    <p className="mt-2 text-sm">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 rounded-xl bg-rose-500/20 px-4 py-2 text-sm hover:bg-rose-500/30"
                    >
                        Try again
                    </button>
                </div>
            )}

            {!loading && !error && dashboard && (
                <>
                    {/* Summary cards */}
                    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-500/20 via-violet-500/10 to-white/[0.04] p-6 shadow-xl shadow-violet-950/20 backdrop-blur-2xl">
                            <p className="text-sm text-violet-200">
                                Total Spending
                            </p>
                            <h2 className="mt-4 text-3xl font-bold">
                                {formatCurrency(dashboard.totalAmount)}
                            </h2>
                            <p className="mt-3 text-xs text-slate-400">
                                Your recorded expenses
                            </p>
                        </div>

                        <div className={`${glassCard} p-6`}>
                            <p className="text-sm text-blue-200">
                                Total Expenses
                            </p>
                            <h2 className="mt-4 text-3xl font-bold">
                                {dashboard.expenseCount}
                            </h2>
                            <p className="mt-3 text-xs text-slate-400">
                                Recorded transactions
                            </p>
                        </div>

                        <div className={`${glassCard} p-6 sm:col-span-2 xl:col-span-1`}>
                            <p className="text-sm text-emerald-200">
                                Most Used Category
                            </p>
                            <h2 className="mt-4 text-2xl font-bold">
                                {dashboard.mostUsedCategory?.name || "No category yet"}
                            </h2>
                            <p className="mt-3 text-xs text-slate-400">
                                {dashboard.mostUsedCategory
                                    ? `${dashboard.mostUsedCategory.expenseCount} expenses`
                                    : "Add an expense to get started"}
                            </p>
                        </div>
                    </section>

                    {/* Recent expenses and category breakdown */}
                    <section className="grid gap-6 xl:grid-cols-5">
                        <div className={`${glassCard} overflow-hidden xl:col-span-3`}>
                            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                                <div>
                                    <h3 className="font-semibold">
                                        Recent Expenses
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Your latest transactions
                                    </p>
                                </div>
                                <span className="text-xs text-violet-300">
                                    Latest 5
                                </span>
                            </div>

                            {dashboard.recentExpenses.length === 0 ? (
                                <p className="p-8 text-center text-sm text-slate-400">
                                    No expenses recorded yet.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-xs uppercase text-slate-400">
                                            <tr>
                                                <th className="px-6 py-4">Expense</th>
                                                <th className="px-6 py-4">Category</th>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dashboard.recentExpenses.map((expense) => (
                                                <tr
                                                    key={expense._id}
                                                    className="border-t border-white/5 transition hover:bg-white/[0.04]"
                                                >
                                                    <td className="px-6 py-5 font-medium">
                                                        {expense.title}
                                                    </td>
                                                    <td className="px-6 py-5 text-slate-300">
                                                        {expense.categoryId?.name || "Uncategorized"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-5 text-slate-400">
                                                        {formatDate(expense.date)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-5 text-right font-semibold text-violet-300">
                                                        {formatCurrency(expense.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className={`${glassCard} p-6 xl:col-span-2`}>
                            <h3 className="font-semibold">
                                Category Breakdown
                            </h3>
                            <p className="mt-1 text-xs text-slate-400">
                                Spending by category
                            </p>

                            {dashboard.categoryStats.length === 0 ? (
                                <p className="mt-8 text-center text-sm text-slate-400">
                                    No category data available.
                                </p>
                            ) : (
                                <div className="mt-8 space-y-7">
                                    {dashboard.categoryStats.map((category) => {
                                        const percentage =
                                            dashboard.totalAmount > 0
                                                ? (category.totalAmount / dashboard.totalAmount) * 100
                                                : 0;

                                        return (
                                            <div key={category.categoryId}>
                                                <div className="mb-2 flex items-center justify-between gap-3">
                                                    <span className="truncate text-sm font-medium">
                                                        {category.categoryName}
                                                    </span>
                                                    <span className="whitespace-nowrap text-xs text-slate-300">
                                                        {formatCurrency(category.totalAmount)}
                                                    </span>
                                                </div>

                                                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-400"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>

                                                <p className="mt-2 text-xs text-slate-400">
                                                    {category.expenseCount} expenses · {percentage.toFixed(1)}%
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

export default DashboardPage;
