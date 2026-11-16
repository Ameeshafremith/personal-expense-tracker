import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
    Plus,
    Target,
    TrendingUp,
    PiggyBank,
    Pencil,
    Trash2,
    ArrowDownLeft,
    ArrowUpRight,
    History,
    RefreshCw,
    X,
    CalendarDays,
    CheckCircle2,
    PauseCircle,
} from "lucide-react";

import api from "../services/api";

type GoalStatus = "active" | "completed" | "paused";
type MovementType = "contribution" | "withdrawal";

interface SavingsGoal {
    _id: string;
    name: string;
    description?: string;
    targetAmount: number;
    savedAmount: number;
    remainingAmount?: number;
    progressPercentage?: number;
    targetDate?: string;
    status: GoalStatus;
    createdAt: string;
}

interface WalletOption {
    _id: string;
    name: string;
    type: string;
    currency: string;
    currentBalance?: number;
}

interface SavingsMovement {
    _id: string;
    goalId: string | { _id: string; name: string };
    walletId: string | { _id: string; name: string; type?: string };
    type: MovementType;
    amount: number;
    date: string;
    description?: string;
}

interface GoalForm {
    name: string;
    description: string;
    targetAmount: string;
    targetDate: string;
    status: GoalStatus;
}

interface MovementForm {
    goalId: string;
    walletId: string;
    type: MovementType;
    amount: string;
    date: string;
    description: string;
}

const emptyGoalForm: GoalForm = {
    name: "",
    description: "",
    targetAmount: "",
    targetDate: "",
    status: "active",
};

const getLocalDate = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000)
        .toISOString()
        .slice(0, 10);
};

const emptyMovementForm: MovementForm = {
    goalId: "",
    walletId: "",
    type: "contribution",
    amount: "",
    date: getLocalDate(),
    description: "",
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: "LKR",
        minimumFractionDigits: 2,
    }).format(amount);

// const getId = (
//     value?: string | { _id: string }
// ) => typeof value === "string" ? value : value?._id || "";

const getName = (
    value?: string | { name: string }
) => typeof value === "string" ? "—" : value?.name || "—";

const formatDate = (date?: string) =>
    date
        ? new Date(date).toLocaleDateString("en-LK", {
              year: "numeric",
              month: "short",
              day: "numeric",
          })
        : "Not set";

function SavingsPage() {
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [wallets, setWallets] = useState<WalletOption[]>([]);
    const [history, setHistory] = useState<SavingsMovement[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [goalModalOpen, setGoalModalOpen] = useState(false);
    const [movementModalOpen, setMovementModalOpen] = useState(false);

    const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

    const [goalForm, setGoalForm] =
        useState<GoalForm>(emptyGoalForm);

    const [movementForm, setMovementForm] =
        useState<MovementForm>(emptyMovementForm);

    const [historyFilter, setHistoryFilter] = useState("all");

    const glassCard =
        "rounded-3xl border border-white/10 bg-white/[0.055] shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-2xl";

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [goalResponse, walletResponse, historyResponse] =
                await Promise.all([
                    api.get("/savings/goals"),
                    api.get("/wallets"),
                    api.get("/savings/history"),
                ]);

            setGoals(goalResponse.data.data || []);
            setWallets(walletResponse.data.data.wallets || []);
            setHistory(historyResponse.data.data || []);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to load savings information."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totals = useMemo(() => {
        const totalTarget = goals.reduce(
            (sum, goal) => sum + goal.targetAmount,
            0
        );

        const totalSaved = goals.reduce(
            (sum, goal) => sum + goal.savedAmount,
            0
        );

        const totalRemaining = goals.reduce(
            (sum, goal) =>
                sum + Math.max(0, goal.targetAmount - goal.savedAmount),
            0
        );

        return {
            totalTarget,
            totalSaved,
            totalRemaining,
            activeGoals: goals.filter(
                (goal) => goal.status === "active"
            ).length,
            completedGoals: goals.filter(
                (goal) => goal.status === "completed"
            ).length,
        };
    }, [goals]);

    const filteredHistory = useMemo(() => {
        return history.filter(
            (movement) =>
                historyFilter === "all" ||
                movement.type === historyFilter
        );
    }, [history, historyFilter]);

    const openAddGoalModal = () => {
        setEditingGoal(null);
        setGoalForm(emptyGoalForm);
        setError("");
        setGoalModalOpen(true);
    };

    const openEditGoalModal = (goal: SavingsGoal) => {
        setEditingGoal(goal);

        setGoalForm({
            name: goal.name,
            description: goal.description || "",
            targetAmount: String(goal.targetAmount),
            targetDate: goal.targetDate
                ? new Date(goal.targetDate).toISOString().slice(0, 10)
                : "",
            status: goal.status,
        });

        setError("");
        setGoalModalOpen(true);
    };

    const openMovementModal = (
        goal?: SavingsGoal,
        type: MovementType = "contribution"
    ) => {
        setMovementForm({
            ...emptyMovementForm,
            goalId: goal?._id || "",
            type,
            date: getLocalDate(),
        });

        setError("");
        setMovementModalOpen(true);
    };

    const handleGoalSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const payload = {
                name: goalForm.name.trim(),
                description: goalForm.description.trim(),
                targetAmount: Number(goalForm.targetAmount),
                targetDate: goalForm.targetDate || undefined,
                ...(editingGoal ? { status: goalForm.status } : {}),
            };

            if (editingGoal) {
                await api.put(
                    `/savings/goals/${editingGoal._id}`,
                    payload
                );

                setSuccess("Savings goal updated successfully.");
            } else {
                await api.post("/savings/goals", payload);

                setSuccess("Savings goal created successfully.");
            }

            setGoalModalOpen(false);
            setGoalForm(emptyGoalForm);

            await fetchData();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to save the savings goal."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleMovementSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const payload = {
                goalId: movementForm.goalId,
                walletId: movementForm.walletId,
                type: movementForm.type,
                amount: Number(movementForm.amount),
                date: movementForm.date,
                description: movementForm.description.trim(),
            };

            await api.post("/savings/movements", payload);

            setMovementModalOpen(false);
            setMovementForm(emptyMovementForm);

            setSuccess(
                movementForm.type === "contribution"
                    ? "Savings contribution recorded successfully."
                    : "Savings withdrawal recorded successfully."
            );

            await fetchData();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to record the savings movement."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGoal = async (goal: SavingsGoal) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${goal.name}"?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await api.delete(`/savings/goals/${goal._id}`);

            setSuccess("Savings goal deleted successfully.");
            await fetchData();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to delete this savings goal."
            );
        }
    };

    const getStatusStyle = (status: GoalStatus) => {
        if (status === "completed") {
            return "bg-emerald-400/10 text-emerald-300";
        }

        if (status === "paused") {
            return "bg-amber-400/10 text-amber-300";
        }

        return "bg-violet-400/10 text-violet-300";
    };

    return (
        <div className="space-y-8">

            {/* Page Heading */}
            <section className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium tracking-wider text-violet-300">
                        FINANCIAL PLANNING
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Savings Goals
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        Plan your savings, track your progress and reach your financial goals.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => openMovementModal()}
                        disabled={goals.length === 0}
                        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ArrowDownLeft size={18} />
                        Record Movement
                    </button>

                    <button
                        onClick={openAddGoalModal}
                        className="flex items-center gap-2 rounded-2xl border border-violet-300/20 bg-violet-500/20 px-5 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/30"
                    >
                        <Plus size={18} />
                        Create Goal
                    </button>
                </div>
            </section>

            {/* Notifications */}
            {error && !goalModalOpen && !movementModalOpen && (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                    {success}
                </div>
            )}

            {/* Overview Cards */}
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

                <div className={`${glassCard} p-6`}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-violet-200">
                            Total Saved
                        </p>
                        <PiggyBank className="text-violet-300" />
                    </div>

                    <h2 className="mt-5 text-2xl font-bold text-white">
                        {formatCurrency(totals.totalSaved)}
                    </h2>

                    <p className="mt-2 text-xs text-slate-400">
                        Across all savings goals
                    </p>
                </div>

                <div className={`${glassCard} p-6`}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-blue-200">
                            Target Amount
                        </p>
                        <Target className="text-blue-300" />
                    </div>

                    <h2 className="mt-5 text-2xl font-bold text-white">
                        {formatCurrency(totals.totalTarget)}
                    </h2>

                    <p className="mt-2 text-xs text-slate-400">
                        Combined goal targets
                    </p>
                </div>

                <div className={`${glassCard} p-6`}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-amber-200">
                            Remaining Amount
                        </p>
                        <TrendingUp className="text-amber-300" />
                    </div>

                    <h2 className="mt-5 text-2xl font-bold text-white">
                        {formatCurrency(totals.totalRemaining)}
                    </h2>

                    <p className="mt-2 text-xs text-slate-400">
                        Amount left to reach your targets
                    </p>
                </div>

                <div className="rounded-3xl border border-emerald-300/20 bg-gradient-to-br from-emerald-500/20 to-white/[0.04] p-6 backdrop-blur-2xl">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-emerald-200">
                            Completed Goals
                        </p>
                        <CheckCircle2 className="text-emerald-300" />
                    </div>

                    <h2 className="mt-5 text-2xl font-bold text-white">
                        {totals.completedGoals}
                    </h2>

                    <p className="mt-2 text-xs text-slate-400">
                        {totals.activeGoals} active goal(s)
                    </p>
                </div>
            </section>

            {/* Savings Goals */}
            <section className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            Your Savings Goals
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Track how close you are to achieving each goal.
                        </p>
                    </div>

                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
                    >
                        <RefreshCw size={15} />
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className={`${glassCard} p-12 text-center text-slate-400`}>
                        Loading savings goals...
                    </div>
                ) : goals.length === 0 ? (
                    <div className={`${glassCard} p-12 text-center`}>
                        <Target
                            size={45}
                            className="mx-auto text-violet-300"
                        />

                        <h3 className="mt-4 font-semibold text-white">
                            No savings goals yet
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                            Create your first savings goal to start tracking your progress.
                        </p>

                        <button
                            onClick={openAddGoalModal}
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                        >
                            <Plus size={17} />
                            Create Your First Goal
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-5 xl:grid-cols-2">
                        {goals.map((goal) => {
                            const progress = Math.min(
                                100,
                                Math.max(
                                    0,
                                    goal.progressPercentage ??
                                    (goal.savedAmount / goal.targetAmount) * 100
                                )
                            );

                            const remaining = Math.max(
                                0,
                                goal.targetAmount - goal.savedAmount
                            );

                            return (
                                <div
                                    key={goal._id}
                                    className={`${glassCard} p-6 transition hover:border-violet-300/20`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
                                                <Target size={23} />
                                            </div>

                                            <div className="min-w-0">
                                                <h3 className="truncate text-lg font-semibold text-white">
                                                    {goal.name}
                                                </h3>

                                                <span className={`mt-1 inline-flex rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${getStatusStyle(goal.status)}`}>
                                                    {goal.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 gap-1">
                                            <button
                                                onClick={() => openEditGoalModal(goal)}
                                                title="Edit goal"
                                                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            <button
                                                onClick={() => handleDeleteGoal(goal)}
                                                title="Delete goal"
                                                className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {goal.description && (
                                        <p className="mt-4 text-sm text-slate-400">
                                            {goal.description}
                                        </p>
                                    )}

                                    <div className="mt-6 flex items-end justify-between gap-3">
                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Amount saved
                                            </p>

                                            <p className="mt-1 text-xl font-bold text-white">
                                                {formatCurrency(goal.savedAmount)}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">
                                                Target amount
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-200">
                                                {formatCurrency(goal.targetAmount)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        <div className="mb-2 flex items-center justify-between text-xs">
                                            <span className="text-slate-400">
                                                Overall progress
                                            </span>

                                            <span className="font-semibold text-violet-300">
                                                {progress.toFixed(1)}%
                                            </span>
                                        </div>

                                        <div className="h-3 overflow-hidden rounded-full bg-white/10">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-400 transition-all duration-500"
                                                style={{
                                                    width: `${progress}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-5 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-white/[0.04] p-3">
                                            <p className="text-xs text-slate-400">
                                                Remaining
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-white">
                                                {formatCurrency(remaining)}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-white/[0.04] p-3">
                                            <p className="text-xs text-slate-400">
                                                Target date
                                            </p>

                                            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-white">
                                                <CalendarDays size={14} className="text-violet-300" />
                                                {formatDate(goal.targetDate)}
                                            </p>
                                        </div>
                                    </div>

                                    {goal.status !== "paused" &&
                                        goal.status !== "completed" && (
                                            <div className="mt-5 flex flex-wrap gap-2">
                                                <button
                                                    onClick={() =>
                                                        openMovementModal(goal, "contribution")
                                                    }
                                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-3 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
                                                >
                                                    <ArrowDownLeft size={16} />
                                                    Add Savings
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        openMovementModal(goal, "withdrawal")
                                                    }
                                                    disabled={goal.savedAmount <= 0}
                                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500/10 px-3 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <ArrowUpRight size={16} />
                                                    Withdraw
                                                </button>
                                            </div>
                                        )}

                                    {goal.status === "paused" && (
                                        <p className="mt-5 flex items-center gap-2 rounded-xl bg-amber-400/10 p-3 text-xs text-amber-300">
                                            <PauseCircle size={16} />
                                            This goal is paused. Edit it to reactivate it.
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Savings History */}
            <section className={`${glassCard} overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5 sm:p-6">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                            <History size={19} className="text-violet-300" />
                            Savings History
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Your previous contributions and withdrawals.
                        </p>
                    </div>

                    <select
                        value={historyFilter}
                        onChange={(e) => setHistoryFilter(e.target.value)}
                        className="rounded-xl border border-white/10 bg-[#202A40] px-4 py-2.5 text-sm text-white outline-none"
                    >
                        <option value="all">All movements</option>
                        <option value="contribution">Contributions</option>
                        <option value="withdrawal">Withdrawals</option>
                    </select>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-slate-400">
                        Loading history...
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="p-10 text-center">
                        <History
                            size={35}
                            className="mx-auto text-violet-300"
                        />

                        <p className="mt-3 font-medium text-white">
                            No savings history found
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                            Your recorded savings movements will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left">
                            <thead className="bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Movement</th>
                                    <th className="px-6 py-4">Savings Goal</th>
                                    <th className="px-6 py-4">Wallet</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-white/[0.06]">
                                {filteredHistory.map((movement) => {
                                    const isContribution =
                                        movement.type === "contribution";

                                    return (
                                        <tr
                                            key={movement._id}
                                            className="transition hover:bg-white/[0.025]"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                                        isContribution
                                                            ? "bg-emerald-400/10 text-emerald-300"
                                                            : "bg-rose-400/10 text-rose-300"
                                                    }`}>
                                                        {isContribution
                                                            ? <ArrowDownLeft size={19} />
                                                            : <ArrowUpRight size={19} />
                                                        }
                                                    </div>

                                                    <div>
                                                        <p className="font-medium capitalize text-white">
                                                            {movement.type}
                                                        </p>

                                                        {movement.description && (
                                                            <p className="mt-1 max-w-[180px] truncate text-xs text-slate-400">
                                                                {movement.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-300">
                                                {getName(movement.goalId)}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-300">
                                                {getName(movement.walletId)}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-400">
                                                {formatDate(movement.date)}
                                            </td>

                                            <td className={`px-6 py-4 text-right text-sm font-semibold ${
                                                isContribution
                                                    ? "text-emerald-300"
                                                    : "text-rose-300"
                                            }`}>
                                                {isContribution ? "+" : "−"}
                                                {formatCurrency(movement.amount)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Create / Edit Goal Modal */}
            {goalModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-[#070B14]/90 p-4 backdrop-blur-xl">
                    <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/20 bg-[#171E30] p-6 shadow-[0_0_80px_rgba(139,92,246,0.15)] sm:p-8">

                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {editingGoal ? "Edit Savings Goal" : "Create Savings Goal"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    Enter your savings goal details.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setGoalModalOpen(false)}
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleGoalSubmit}>
                            <div className="space-y-5">

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Goal Name
                                    </label>

                                    <input
                                        required
                                        maxLength={100}
                                        value={goalForm.name}
                                        onChange={(e) =>
                                            setGoalForm({
                                                ...goalForm,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. New Laptop"
                                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Target Amount (LKR)
                                    </label>

                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        required
                                        value={goalForm.targetAmount}
                                        onChange={(e) =>
                                            setGoalForm({
                                                ...goalForm,
                                                targetAmount: e.target.value,
                                            })
                                        }
                                        placeholder="0.00"
                                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Target Date (Optional)
                                    </label>

                                    <input
                                        type="date"
                                        value={goalForm.targetDate}
                                        onChange={(e) =>
                                            setGoalForm({
                                                ...goalForm,
                                                targetDate: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
                                    />
                                </div>

                                {editingGoal && (
                                    <div>
                                        <label className="mb-2 block text-sm text-slate-300">
                                            Goal Status
                                        </label>

                                        <select
                                            value={goalForm.status}
                                            onChange={(e) =>
                                                setGoalForm({
                                                    ...goalForm,
                                                    status: e.target.value as GoalStatus,
                                                })
                                            }
                                            className="w-full rounded-xl border border-white/10 bg-[#202A40] px-4 py-3 text-sm text-white outline-none"
                                        >
                                            <option value="active">Active</option>
                                            <option value="paused">Paused</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Description (Optional)
                                    </label>

                                    <textarea
                                        rows={3}
                                        maxLength={500}
                                        value={goalForm.description}
                                        onChange={(e) =>
                                            setGoalForm({
                                                ...goalForm,
                                                description: e.target.value,
                                            })
                                        }
                                        placeholder="Describe what you are saving for..."
                                        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
                                    />
                                </div>
                            </div>

                            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setGoalModalOpen(false)}
                                    className="rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/5"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:opacity-50"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingGoal
                                            ? "Save Changes"
                                            : "Create Goal"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Contribution / Withdrawal Modal */}
            {movementModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-[#070B14]/90 p-4 backdrop-blur-xl">
                    <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/20 bg-[#171E30] p-6 shadow-[0_0_80px_rgba(139,92,246,0.15)] sm:p-8">

                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Record Savings Movement
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    Add money to or withdraw money from a savings goal.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setMovementModalOpen(false)}
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleMovementSubmit}>
                            <div className="space-y-5">

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Movement Type
                                    </label>

                                    <select
                                        value={movementForm.type}
                                        onChange={(e) =>
                                            setMovementForm({
                                                ...movementForm,
                                                type: e.target.value as MovementType,
                                            })
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-[#202A40] px-4 py-3 text-sm text-white outline-none"
                                    >
                                        <option value="contribution">
                                            Contribution
                                        </option>
                                        <option value="withdrawal">
                                            Withdrawal
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Savings Goal
                                    </label>

                                    <select
                                        required
                                        value={movementForm.goalId}
                                        onChange={(e) =>
                                            setMovementForm({
                                                ...movementForm,
                                                goalId: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-[#202A40] px-4 py-3 text-sm text-white outline-none"
                                    >
                                        <option value="">
                                            Select savings goal
                                        </option>

                                        {goals
                                            .filter((goal) =>
                                                movementForm.type === "contribution"
                                                    ? goal.status === "active"
                                                    : goal.savedAmount > 0 &&
                                                      goal.status !== "paused"
                                            )
                                            .map((goal) => (
                                                <option
                                                    key={goal._id}
                                                    value={goal._id}
                                                >
                                                    {goal.name} — Saved: {formatCurrency(goal.savedAmount)}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Wallet
                                    </label>

                                    <select
                                        required
                                        value={movementForm.walletId}
                                        onChange={(e) =>
                                            setMovementForm({
                                                ...movementForm,
                                                walletId: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-[#202A40] px-4 py-3 text-sm text-white outline-none"
                                    >
                                        <option value="">
                                            Select wallet
                                        </option>

                                        {wallets
                                            .filter(
                                                (wallet) =>
                                                    wallet.type !== "credit_card"
                                            )
                                            .map((wallet) => (
                                                <option
                                                    key={wallet._id}
                                                    value={wallet._id}
                                                >
                                                    {wallet.name}
                                                    {wallet.currentBalance !== undefined
                                                        ? ` — ${formatCurrency(wallet.currentBalance)}`
                                                        : ""}
                                                </option>
                                            ))}
                                    </select>

                                    <p className="mt-2 text-xs text-slate-500">
                                        Credit card wallets cannot be used for savings movements.
                                    </p>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm text-slate-300">
                                            Amount (LKR)
                                        </label>

                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            required
                                            value={movementForm.amount}
                                            onChange={(e) =>
                                                setMovementForm({
                                                    ...movementForm,
                                                    amount: e.target.value,
                                                })
                                            }
                                            placeholder="0.00"
                                            className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm text-slate-300">
                                            Date
                                        </label>

                                        <input
                                            type="date"
                                            required
                                            value={movementForm.date}
                                            onChange={(e) =>
                                                setMovementForm({
                                                    ...movementForm,
                                                    date: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Description (Optional)
                                    </label>

                                    <textarea
                                        rows={3}
                                        maxLength={500}
                                        value={movementForm.description}
                                        onChange={(e) =>
                                            setMovementForm({
                                                ...movementForm,
                                                description: e.target.value,
                                            })
                                        }
                                        placeholder="Add a note..."
                                        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
                                    />
                                </div>
                            </div>

                            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setMovementModalOpen(false)}
                                    className="rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/5"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50 ${
                                        movementForm.type === "contribution"
                                            ? "bg-gradient-to-r from-emerald-600 to-teal-500"
                                            : "bg-gradient-to-r from-rose-600 to-pink-500"
                                    }`}
                                >
                                    {saving
                                        ? "Processing..."
                                        : movementForm.type === "contribution"
                                            ? "Add Contribution"
                                            : "Record Withdrawal"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SavingsPage;