
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAppDispatch } from "../app/hooks";
import { logout } from "../features/auth/authSlice";

interface Category {
    _id: string;
    name: string;
    description?: string;
}

interface Expense {
    _id: string;
    title: string;
    amount: number;
    date: string;
    categoryId: {
        _id: string;
        name: string;
    };
}

interface ExpenseForm {
    title: string;
    amount: string;
    date: string;
    categoryId: string;
}

const emptyForm: ExpenseForm = {
    title: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    categoryId: "",
};

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

function ExpensesPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ExpenseForm>(emptyForm);
    const [saving, setSaving] = useState(false);

    const fetchExpenses = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const params: Record<string, string> = {};

            if (filterCategory) params.categoryId = filterCategory;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await api.get("/expenses", { params });

            setExpenses(response.data.expenses || []);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to retrieve expenses."
            );
        } finally {
            setLoading(false);
        }
    }, [filterCategory, startDate, endDate]);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await api.get("/categories");
            setCategories(response.data.categories || []);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to retrieve categories."
            );
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const openAddForm = () => {
        setEditingId(null);
        setForm({
            ...emptyForm,
            date: new Date().toISOString().slice(0, 10),
            categoryId: categories[0]?._id || "",
        });
        setError("");
        setSuccess("");
        setShowForm(true);
    };

    const openEditForm = (expense: Expense) => {
        setEditingId(expense._id);
        setForm({
            title: expense.title,
            amount: String(expense.amount),
            date: expense.date.slice(0, 10),
            categoryId: expense.categoryId?._id || "",
        });
        setError("");
        setSuccess("");
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
    };

    const handleFormChange = (
        field: keyof ExpenseForm,
        value: string
    ) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        const amount = Number(form.amount);

        if (!form.title.trim()) {
            setError("Please enter an expense title.");
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            setError("Please enter a valid amount greater than zero.");
            return;
        }

        if (!form.date || !form.categoryId) {
            setError("Please select a date and category.");
            return;
        }

        const expenseData = {
            title: form.title.trim(),
            amount,
            date: form.date,
            categoryId: form.categoryId,
        };

        try {
            setSaving(true);

            if (editingId) {
                await api.put(`/expenses/${editingId}`, expenseData);
                setSuccess("Expense updated successfully.");
            } else {
                await api.post("/expenses", expenseData);
                setSuccess("Expense added successfully.");
            }

            closeForm();
            await fetchExpenses();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to save the expense."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (expense: Expense) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${expense.title}"?`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            await api.delete(`/expenses/${expense._id}`);
            setSuccess("Expense deleted successfully.");
            await fetchExpenses();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to delete the expense."
            );
        }
    };

    const clearFilters = () => {
        setFilterCategory("");
        setStartDate("");
        setEndDate("");
        setSearch("");
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login", { replace: true });
    };

    const filteredExpenses = expenses.filter((expense) =>
        expense.title.toLowerCase().includes(search.toLowerCase())
    );

    const totalAmount = filteredExpenses.reduce(
        (total, expense) => total + expense.amount,
        0
    );

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
                    {/* Dashboard */}
                    <button
                        type="button"
                        onClick={() => navigate("/dashboard")}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                        <span className="text-lg">▦</span>
                        Dashboard
                    </button>

                    {/* Expenses */}
                    <button
                        type="button"
                        onClick={() => navigate("/expenses")}
                        className="flex w-full items-center gap-3 rounded-xl bg-indigo-500/15 px-4 py-3 text-left text-sm font-medium text-indigo-300"
                    >
                        <span className="text-lg">↗</span>
                        Expenses
                    </button>

                    {/* Categories */}
                    <button
                        type="button"
                        onClick={() => navigate("/categories")}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                        <span className="text-lg">◈</span>
                        Categories
                    </button>

                    {/* Reports */}
                    <button
                        type="button"
                        onClick={() => navigate("/reports")}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                        <span className="text-lg">▤</span>
                        Reports
                    </button>
                </nav>


                <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold">Manage your money</p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                        Keep your expenses organized in one place.
                    </p>
                </div>
            </aside>

            {/* Main area */}
            <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">

                {/* Header */}
                <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-400">Workspace</p>
                        <h2 className="mt-1 text-3xl font-bold tracking-tight">
                            Expenses
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Track and manage your daily spending.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5"
                        >
                            Dashboard
                        </button>

                        <button
                            onClick={handleLogout}
                            className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Notifications */}
                {error && (
                    <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
                        {success}
                    </div>
                )}

                {/* Summary and add button */}
                <section className="mb-7 flex flex-wrap items-center justify-between gap-5">
                    <div className="min-w-[220px] flex-1 rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/20 to-[#151c36] p-6">
                        <p className="text-sm text-indigo-200">
                            {filterCategory || startDate || endDate || search
                                ? "Filtered Spending"
                                : "Total Spending"}
                        </p>
                        <h3 className="mt-3 text-3xl font-bold">
                            {formatCurrency(totalAmount)}
                        </h3>
                        <p className="mt-2 text-xs text-slate-400">
                            {filteredExpenses.length} expense(s) displayed
                        </p>
                    </div>

                    <button
                        onClick={openAddForm}
                        disabled={categories.length === 0}
                        className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 text-sm font-semibold shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        + Add Expense
                    </button>
                </section>

                {/* Filters */}
                <section className="mb-7 rounded-2xl border border-white/10 bg-[#111a30] p-5">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="font-semibold">Filter Expenses</h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Search and narrow down your transactions.
                            </p>
                        </div>

                        <button
                            onClick={clearFilters}
                            className="text-xs font-medium text-indigo-300 transition hover:text-indigo-200"
                        >
                            Clear filters
                        </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                            <label className="mb-2 block text-xs text-slate-400">
                                Search by title
                            </label>
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search expenses..."
                                className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-indigo-400"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs text-slate-400">
                                Category
                            </label>
                            <select
                                value={filterCategory}
                                onChange={(event) => setFilterCategory(event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none focus:border-indigo-400"
                            >
                                <option value="">All categories</option>
                                {categories.map((category) => (
                                    <option key={category._id} value={category._id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs text-slate-400">
                                Start date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                max={endDate || undefined}
                                onChange={(event) => setStartDate(event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none focus:border-indigo-400"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs text-slate-400">
                                End date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                min={startDate || undefined}
                                onChange={(event) => setEndDate(event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none focus:border-indigo-400"
                            />
                        </div>
                    </div>
                </section>

                {/* Expense table */}
                <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111a30]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
                        <div>
                            <h3 className="font-semibold">All Expenses</h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Your recorded transactions
                            </p>
                        </div>

                        <span className="rounded-full bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300">
                            {filteredExpenses.length} records
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-sm text-slate-400">
                            Loading expenses...
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-lg font-semibold">
                                No expenses found
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                                Try changing your filters or add a new expense.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/[0.02] text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Expense</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredExpenses.map((expense) => (
                                        <tr
                                            key={expense._id}
                                            className="border-t border-white/5 transition hover:bg-white/[0.025]"
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

                                            <td className="px-6 py-5">
                                                <div className="flex justify-center gap-3">
                                                    <button
                                                        onClick={() => openEditForm(expense)}
                                                        className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(expense)}
                                                        className="text-xs font-medium text-red-400 hover:text-red-300"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            {/* Add/Edit modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
                    <div className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#151e34] p-6 shadow-2xl sm:p-8">
                        <div className="mb-7 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold">
                                    {editingId ? "Edit Expense" : "Add New Expense"}
                                </h3>
                                <p className="mt-1 text-xs text-slate-400">
                                    Enter your transaction details below.
                                </p>
                            </div>

                            <button
                                onClick={closeForm}
                                className="rounded-lg px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-white"
                                aria-label="Close form"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    Expense title
                                </label>
                                <input
                                    required
                                    maxLength={100}
                                    value={form.title}
                                    onChange={(event) => handleFormChange("title", event.target.value)}
                                    placeholder="e.g. Monthly Groceries"
                                    className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-indigo-400"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    Amount (LKR)
                                </label>
                                <input
                                    required
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={(event) => handleFormChange("amount", event.target.value)}
                                    placeholder="Enter amount"
                                    className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-indigo-400"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    Category
                                </label>
                                <select
                                    required
                                    value={form.categoryId}
                                    onChange={(event) => handleFormChange("categoryId", event.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none focus:border-indigo-400"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((category) => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    Expense date
                                </label>
                                <input
                                    required
                                    type="date"
                                    value={form.date}
                                    onChange={(event) => handleFormChange("date", event.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none focus:border-indigo-400"
                                />
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving || categories.length === 0}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-sm font-semibold transition hover:brightness-110 disabled:opacity-50"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Update Expense"
                                            : "Save Expense"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExpensesPage;
