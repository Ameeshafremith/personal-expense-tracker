
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logoutUser } from "../features/auth/authSlice";

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
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

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

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate("/login", { replace: true });
    };

    const navigationItems = [
        { name: "Dashboard", icon: "▦", active: true },
        { name: "Expenses", icon: "↗", active: false },
        { name: "Categories", icon: "◈", active: false },
        { name: "Reports", icon: "▤", active: false },
    ];

    return (
        <div className="flex min-h-screen bg-[#0b1020] text-white">

            {/* Sidebar */}
            <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#10172a] p-6 md:flex">

                <div className="mb-12">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Expense<span className="text-indigo-400">Flow</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                        PERSONAL FINANCE TRACKER
                    </p>
                </div>

                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Workspace
                </p>

                
                
                <nav className="space-y-2">
                    {navigationItems.map((item) => (
                        item.name === "Dashboard" ? (
                            <div
                                key={item.name}
                                className="flex w-full items-center gap-3 rounded-xl bg-indigo-500/15 px-4 py-3 text-sm font-medium text-indigo-300"
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.name}
                            </div>
                        ) : (
                            <button
                                key={item.name}
                                type="button"
                                onClick={() => {
                                    if (item.name === "Expenses") {
                                        navigate("/expenses");
                                    } else if (item.name === "Categories") {
                                        navigate("/categories");
                                    } else if (item.name === "Reports") {
                                        navigate("/reports");
                                    }
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.name}
                            </button>
                        )
                    ))}
                </nav>


                <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold">Stay on track</p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                        Keep recording your expenses to understand your spending habits.
                    </p>
                </div>
            </aside>

            {/* Main content */}
            <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">

                {/* Header */}
                <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-400">
                            Overview
                        </p>
                        <h2 className="mt-1 text-3xl font-bold tracking-tight">
                            Dashboard
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Welcome back, {user?.name || "User"}!
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
                    >
                        ↪ Logout
                    </button>
                </header>

                {/* Loading */}
                {loading && (
                    <div className="rounded-2xl border border-white/10 bg-[#111a30] p-10 text-center text-slate-400">
                        Loading your dashboard...
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-red-300">
                        <p className="font-semibold">Dashboard could not load</p>
                        <p className="mt-2 text-sm">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm hover:bg-red-500/30"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Dashboard data */}
                {!loading && !error && dashboard && (
                    <>
                        {/* Summary cards */}
                        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

                            <div className="rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/20 to-[#151c36] p-6">
                                <p className="text-sm text-indigo-200">
                                    Total Spending
                                </p>
                                <h3 className="mt-4 text-3xl font-bold">
                                    {formatCurrency(dashboard.totalAmount)}
                                </h3>
                                <p className="mt-3 text-xs text-slate-400">
                                    Your recorded expenses
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-[#111a30] p-6">
                                <p className="text-sm text-slate-400">
                                    Total Expenses
                                </p>
                                <h3 className="mt-4 text-3xl font-bold">
                                    {dashboard.expenseCount}
                                </h3>
                                <p className="mt-3 text-xs text-slate-500">
                                    Recorded transactions
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-[#111a30] p-6 sm:col-span-2 xl:col-span-1">
                                <p className="text-sm text-slate-400">
                                    Most Used Category
                                </p>
                                <h3 className="mt-4 text-2xl font-bold">
                                    {dashboard.mostUsedCategory?.name || "No category yet"}
                                </h3>
                                <p className="mt-3 text-xs text-slate-500">
                                    {dashboard.mostUsedCategory
                                        ? `${dashboard.mostUsedCategory.expenseCount} expenses`
                                        : "Add an expense to get started"}
                                </p>
                            </div>
                        </section>

                        {/* Lower sections */}
                        <section className="mt-8 grid gap-6 xl:grid-cols-5">

                            {/* Recent expenses */}
                            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111a30] xl:col-span-3">
                                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                                    <div>
                                        <h3 className="font-semibold">
                                            Recent Expenses
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Your latest transactions
                                        </p>
                                    </div>
                                    <span className="text-xs text-indigo-300">
                                        Latest 5
                                    </span>
                                </div>

                                {dashboard.recentExpenses.length === 0 ? (
                                    <p className="p-8 text-center text-sm text-slate-500">
                                        No expenses recorded yet.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="text-xs uppercase text-slate-500">
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
                                                        className="border-t border-white/5 transition hover:bg-white/[0.03]"
                                                    >
                                                        <td className="px-6 py-5 font-medium">
                                                            {expense.title}
                                                        </td>
                                                        <td className="px-6 py-5 text-slate-400">
                                                            {expense.categoryId?.name || "Uncategorized"}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-5 text-slate-400">
                                                            {formatDate(expense.date)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-5 text-right font-semibold text-indigo-300">
                                                            {formatCurrency(expense.amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Category breakdown */}
                            <div className="rounded-2xl border border-white/10 bg-[#111a30] p-6 xl:col-span-2">
                                <h3 className="font-semibold">
                                    Category Breakdown
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Spending by category
                                </p>

                                {dashboard.categoryStats.length === 0 ? (
                                    <p className="mt-8 text-center text-sm text-slate-500">
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
                                                        <span className="whitespace-nowrap text-xs text-slate-400">
                                                            {formatCurrency(category.totalAmount)}
                                                        </span>
                                                    </div>

                                                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>

                                                    <p className="mt-2 text-xs text-slate-500">
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
            </main>
        </div>
    );
}

export default DashboardPage;
