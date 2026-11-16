import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    CircleAlert,
    Pencil,
    Plus,
    RefreshCw,
    Target,
    Trash2,
    Wallet,
    X,
} from "lucide-react";
import api from "../services/api";

interface CategoryOption {
    _id: string;
    name: string;
}

interface Budget {
    _id: string;
    categoryId: CategoryOption | string;
    amount: number;
    month: number;
    year: number;
    rolloverEnabled: boolean;
    rolloverAmount: number;
    spent: number;
    available: number;
    remaining: number;
    exceeded: boolean;
    progressPercentage: number;
}

interface BudgetForm {
    categoryId: string;
    amount: string;
    rolloverEnabled: boolean;
}

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: "LKR",
        maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);

const getCategoryId = (category: CategoryOption | string) =>
    typeof category === "string" ? category : category?._id || "";

const getCategoryName = (category: CategoryOption | string) =>
    typeof category === "string" ? "Category" : category?.name || "Category";

function BudgetsPage() {
    const today = new Date();

    const [month, setMonth] = useState(() => {
        const savedMonth = localStorage.getItem("budgetMonth");
        return savedMonth ? Number(savedMonth) : today.getMonth() + 1;
    });

    const [year, setYear] = useState(() => {
        const savedYear = localStorage.getItem("budgetYear");
        return savedYear ? Number(savedYear) : today.getFullYear();
    });

    useEffect(() => {
        localStorage.setItem("budgetMonth", String(month));
        localStorage.setItem("budgetYear", String(year));
    }, [month, year]);

    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [form, setForm] = useState<BudgetForm>({
        categoryId: "",
        amount: "",
        rolloverEnabled: false,
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const [budgetResponse, categoryResponse] = await Promise.all([
                api.get("/budgets", { params: { month, year } }),
                api.get("/categories"),
            ]);

            // Confirmed API shapes:
            // GET /budgets -> { success, count, data: Budget[] }
            // GET /categories -> { success, count, categories: Category[] }
            setBudgets(Array.isArray(budgetResponse.data.data) ? budgetResponse.data.data : []);
            setCategories(Array.isArray(categoryResponse.data.categories) ? categoryResponse.data.categories : []);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to load budgets. Please try again."
            );
            setBudgets([]);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const totals = useMemo(() => {
        const allocated = budgets.reduce((sum, budget) => sum + Number(budget.amount || 0), 0);
        const spent = budgets.reduce((sum, budget) => sum + Number(budget.spent || 0), 0);
        const remaining = budgets.reduce((sum, budget) => sum + Number(budget.remaining ?? budget.available ?? 0), 0);
        return { allocated, spent, remaining };
    }, [budgets]);

    const changeMonth = (direction: -1 | 1) => {
        const date = new Date(year, month - 1 + direction, 1);
        setMonth(date.getMonth() + 1);
        setYear(date.getFullYear());
        setError("");
        setSuccess("");
    };

    const openAddModal = () => {
        setEditingBudget(null);
        const alreadyBudgeted = new Set(budgets.map((budget) => getCategoryId(budget.categoryId)));
        const firstAvailable = categories.find((category) => !alreadyBudgeted.has(category._id));
        setForm({
            categoryId: firstAvailable?._id || "",
            amount: "",
            rolloverEnabled: false,
        });
        setError("");
        setSuccess("");
        setModalOpen(true);
    };

    const openEditModal = (budget: Budget) => {
        setEditingBudget(budget);
        setForm({
            categoryId: getCategoryId(budget.categoryId),
            amount: String(budget.amount),
            rolloverEnabled: Boolean(budget.rolloverEnabled),
        });
        setError("");
        setSuccess("");
        setModalOpen(true);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const amount = Number(form.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            setError("Enter a valid budget amount greater than zero.");
            return;
        }
        if (!form.categoryId) {
            setError("Please select a category.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            if (editingBudget) {
                // Confirmed update format: PUT /budgets/:id
                // Body: { amount, rolloverEnabled }
                await api.put(`/budgets/${editingBudget._id}`, {
                    categoryId: form.categoryId,
                    amount,
                    rolloverEnabled: form.rolloverEnabled,
                });
                setSuccess("Budget updated successfully.");
            } else {
                // Confirmed create format: POST /budgets
                await api.post("/budgets", {
                    categoryId: form.categoryId,
                    amount,
                    month,
                    year,
                    rolloverEnabled: form.rolloverEnabled,
                });
                setSuccess("Budget created successfully.");
            }

            setModalOpen(false);
            await fetchData();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to save this budget. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (budget: Budget) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete the ${getCategoryName(budget.categoryId)} budget for ${monthNames[month - 1]} ${year}?`
        );
        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");
            await api.delete(`/budgets/${budget._id}`);
            setSuccess("Budget deleted successfully.");
            await fetchData();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to delete this budget."
            );
        }
    };

    const budgetedCategoryIds = new Set(budgets.map((budget) => getCategoryId(budget.categoryId)));
    const availableCategories = categories.filter((category) =>
        !budgetedCategoryIds.has(category._id) || category._id === form.categoryId
    );

    const glassCard =
        "rounded-3xl border border-white/10 bg-white/[0.055] shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-2xl";

    return (
        <div className="space-y-8">
            <section className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium tracking-wider text-violet-300">
                        MONTHLY PLANNING
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Budgets
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Plan your spending and keep each category on track.
                    </p>
                </div>

                <button
                    onClick={openAddModal}
                    disabled={categories.length === 0 || availableCategories.length === 0}
                    className="flex items-center gap-2 rounded-2xl border border-violet-300/20 bg-violet-500/20 px-5 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Plus size={18} />
                    Add Budget
                </button>
            </section>

            {error && !modalOpen && (
                <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                    <CircleAlert size={18} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            <section className={`${glassCard} flex flex-wrap items-center justify-between gap-4 p-5`}>
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
                        <CalendarDays size={21} />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400">Selected period</p>
                        <h2 className="mt-1 text-lg font-semibold text-white">
                            {monthNames[month - 1]} {year}
                        </h2>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => changeMonth(-1)}
                        aria-label="Previous month"
                        className="rounded-xl border border-white/10 p-3 text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <button
                        onClick={() => {
                            const now = new Date();
                            setMonth(now.getMonth() + 1);
                            setYear(now.getFullYear());
                        }}
                        className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                        This month
                    </button>
                    <button
                        onClick={() => changeMonth(1)}
                        aria-label="Next month"
                        className="rounded-xl border border-white/10 p-3 text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                        <ArrowRight size={18} />
                    </button>
                </div>
            </section>

            <section className="grid gap-5 md:grid-cols-3">
                <div className={`${glassCard} p-6`}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-violet-200">Total Allocated</p>
                        <Target className="text-violet-300" />
                    </div>
                    <h2 className="mt-5 text-2xl font-bold text-white">{formatCurrency(totals.allocated)}</h2>
                    <p className="mt-2 text-xs text-slate-400">{budgets.length} category budget(s)</p>
                </div>
                <div className={`${glassCard} p-6`}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-rose-200">Total Spent</p>
                        <Wallet className="text-rose-300" />
                    </div>
                    <h2 className="mt-5 text-2xl font-bold text-white">{formatCurrency(totals.spent)}</h2>
                    <p className="mt-2 text-xs text-slate-400">
                        {totals.allocated > 0 ? `${Math.min(100, (totals.spent / totals.allocated) * 100).toFixed(1)}% of allocated budget` : "No budget allocated"}
                    </p>
                </div>
                <div className={`${glassCard} p-6`}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-emerald-200">Remaining</p>
                        <CheckCircle2 className="text-emerald-300" />
                    </div>
                    <h2 className="mt-5 text-2xl font-bold text-white">{formatCurrency(totals.remaining)}</h2>
                    <p className="mt-2 text-xs text-slate-400">Across all category budgets</p>
                </div>
            </section>

            <section className={`${glassCard} overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5 sm:p-6">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Category Budgets</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Spending progress for {monthNames[month - 1]} {year}
                        </p>
                    </div>
                    <button
                        onClick={() => void fetchData()}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-400">Loading budgets...</div>
                ) : budgets.length === 0 ? (
                    <div className="p-12 text-center">
                        <Target size={42} className="mx-auto text-violet-300" />
                        <h3 className="mt-4 font-semibold text-white">No budgets for this month</h3>
                        <p className="mt-2 text-sm text-slate-400">
                            Create a category budget to start tracking your spending.
                        </p>
                        {categories.length > 0 && (
                            <button
                                onClick={openAddModal}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-500/20 px-4 py-2.5 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/30"
                            >
                                <Plus size={16} /> Create your first budget
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.06]">
                        {budgets.map((budget) => {
                            const spent = Number(budget.spent || 0);
                            const amount = Number(budget.amount || 0);
                            const progress = Math.max(0, Math.min(100, Number(budget.progressPercentage || 0)));
                            const isExceeded = Boolean(budget.exceeded) || spent > amount;
                            const remaining = Number(budget.remaining ?? budget.available ?? amount - spent);

                            return (
                                <article key={budget._id} className="p-5 sm:p-6">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold text-white">
                                                    {getCategoryName(budget.categoryId)}
                                                </h3>
                                                {isExceeded && (
                                                    <span className="rounded-full bg-rose-400/10 px-2.5 py-1 text-xs font-medium text-rose-300">
                                                        Budget exceeded
                                                    </span>
                                                )}
                                                {budget.rolloverEnabled && (
                                                    <span className="rounded-full bg-blue-400/10 px-2.5 py-1 text-xs font-medium text-blue-300">
                                                        Rollover on
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-slate-400">
                                                {formatCurrency(spent)} spent of {formatCurrency(amount)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEditModal(budget)}
                                                title="Edit budget"
                                                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                                            >
                                                <Pencil size={17} />
                                            </button>
                                            <button
                                                onClick={() => void handleDelete(budget)}
                                                title="Delete budget"
                                                className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${isExceeded ? "bg-rose-400" : progress >= 80 ? "bg-amber-300" : "bg-gradient-to-r from-violet-400 to-blue-400"}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                                        <span className="text-slate-400">{progress.toFixed(1)}% used</span>
                                        <span className={isExceeded ? "font-medium text-rose-300" : "text-emerald-300"}>
                                            {isExceeded ? `${formatCurrency(Math.abs(remaining))} over budget` : `${formatCurrency(remaining)} remaining`}
                                        </span>
                                    </div>
                                    {Number(budget.rolloverAmount || 0) > 0 && (
                                        <p className="mt-2 text-xs text-blue-300">
                                            Rollover amount: {formatCurrency(Number(budget.rolloverAmount))}
                                        </p>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {categories.length === 0 && !loading && (
                <p className="text-center text-sm text-slate-500">
                    Create a category first before adding a budget.
                </p>
            )}

            {modalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-[#070B14]/90 p-4 backdrop-blur-xl">
                    <div className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-3xl border border-white/20 bg-[#171E30] p-6 shadow-[0_0_80px_rgba(139,92,246,0.15)] sm:p-8">
                        <div className="mb-6 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {editingBudget ? "Edit Budget" : "Create Budget"}
                                </h2>
                                <p className="mt-1 text-sm text-slate-400">
                                    {monthNames[month - 1]} {year}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                                aria-label="Close dialog"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            
                            <div>
                                <label className="mb-2 block text-sm text-slate-300">Category</label>
                                <select
                                    required
                                    value={form.categoryId}
                                    onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                                    className="w-full rounded-xl border border-white/10 bg-[#202A40] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
                                >
                                    <option value="">Select category</option>
                                    {availableCategories.map((category) => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {availableCategories.length === 0 && (
                                    <p className="mt-2 text-xs text-amber-300">
                                     All categories already have a budget for this month.                                        </p>
                                )}
                            </div>
                            

                            <div>
                                <label className="mb-2 block text-sm text-slate-300">Monthly budget amount (LKR)</label>
                                <input
                                    type="number"
                                    required
                                    min="0.01"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={(event) => setForm({ ...form, amount: event.target.value })}
                                    placeholder="e.g. 15000"
                                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
                                />
                            </div>

                            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                                <input
                                    type="checkbox"
                                    checked={form.rolloverEnabled}
                                    onChange={(event) => setForm({ ...form, rolloverEnabled: event.target.checked })}
                                    className="mt-1 h-4 w-4 accent-violet-400"
                                />
                                <span>
                                    <span className="block text-sm font-medium text-white">Enable unused budget rollover</span>
                                    <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                                        Allow the backend rollover feature to carry eligible unused budget amounts into a later period.
                                    </span>
                                </span>
                            </label>

                            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !form.categoryId}
                                    className="rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : editingBudget ? "Save Changes" : "Create Budget"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BudgetsPage;
