
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
    ArrowDownLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Plus,
    RefreshCw,
    Search,
    Wallet,
    X,
    TrendingUp,
    Repeat,
    CircleDollarSign,
    Pencil,
    Trash2,
} from "lucide-react";

import api from "../services/api";

type IncomeFrequency = "one_time" | "monthly";
type IncomeStatus = "expected" | "received";

interface WalletOption {
    _id: string;
    name: string;
    type: string;
    currency?: string;
}

interface Income {
    _id: string;
    title: string;
    amount: number;
    frequency: IncomeFrequency;
    status: IncomeStatus;
    walletId: WalletOption | string;
    expectedDate: string;
    receivedDate?: string;
    description?: string;
    transactionId?: string;
}

interface IncomeForm {
    title: string;
    amount: string;
    frequency: IncomeFrequency;
    walletId: string;
    expectedDate: string;
    description: string;
}

const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const emptyForm: IncomeForm = {
    title: "",
    amount: "",
    frequency: "one_time",
    walletId: "",
    expectedDate: getToday(),
    description: "",
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: "LKR",
        minimumFractionDigits: 2,
    }).format(amount);

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-LK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

const getWalletId = (wallet: WalletOption | string) =>
    typeof wallet === "string" ? wallet : wallet?._id || "";

const getWalletName = (wallet: WalletOption | string) =>
    typeof wallet === "string" ? "Wallet" : wallet?.name || "Wallet";

function IncomePage() {
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [wallets, setWallets] = useState<WalletOption[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [receivingId, setReceivingId] = useState("");
    const [deletingId, setDeletingId] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    const [form, setForm] = useState<IncomeForm>(emptyForm);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [frequencyFilter, setFrequencyFilter] = useState("all");

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [incomeResponse, walletResponse] = await Promise.all([
                api.get("/incomes"),
                api.get("/wallets"),
            ]);

            setIncomes(incomeResponse.data.data || []);
            setWallets(walletResponse.data.data.wallets || []);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to load income information."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!success && !error) return;

        const notificationTimer = window.setTimeout(() => {
            setSuccess("");
            setError("");
        }, 4000);

        return () => window.clearTimeout(notificationTimer);
    }, [success, error]);

    const totals = useMemo(() => {
        const expected = incomes
            .filter((item) => item.status === "expected")
            .reduce((sum, item) => sum + item.amount, 0);

        const received = incomes
            .filter((item) => item.status === "received")
            .reduce((sum, item) => sum + item.amount, 0);

        const monthly = incomes
            .filter(
                (item) =>
                    item.status === "expected" &&
                    item.frequency === "monthly"
            )
            .reduce((sum, item) => sum + item.amount, 0);

        return { expected, received, monthly };
    }, [incomes]);

    const filteredIncomes = useMemo(() => {
        return incomes
            .filter((item) => {
                const matchesSearch = item.title
                    .toLowerCase()
                    .includes(search.toLowerCase());

                const matchesStatus =
                    statusFilter === "all" ||
                    item.status === statusFilter;

                const matchesFrequency =
                    frequencyFilter === "all" ||
                    item.frequency === frequencyFilter;

                return matchesSearch && matchesStatus && matchesFrequency;
            })
            .sort(
                (a, b) =>
                    new Date(b.expectedDate).getTime() -
                    new Date(a.expectedDate).getTime()
            );
    }, [incomes, search, statusFilter, frequencyFilter]);

    const openAddModal = () => {
        setEditingIncome(null);
        setForm({
            ...emptyForm,
            expectedDate: getToday(),
        });
        setError("");
        setSuccess("");
        setModalOpen(true);
    };

    const openEditModal = (income: Income) => {
        setEditingIncome(income);

        setForm({
            title: income.title,
            amount: String(income.amount),
            frequency: income.frequency,
            walletId: getWalletId(income.walletId),
            expectedDate: (
                income.status === "received"
                    ? income.receivedDate
                    : income.expectedDate
            )?.slice(0, 10) || getToday(),
            description: income.description || "",
        });

        setError("");
        setSuccess("");
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingIncome(null);
        setError("");
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const commonPayload = {
                title: form.title.trim(),
                amount: Number(form.amount),
                walletId: form.walletId,
                description: form.description.trim(),
            };

            if (editingIncome) {
                const payload =
                    editingIncome.status === "received"
                        ? {
                            ...commonPayload,
                            receivedDate: form.expectedDate,
                        }
                        : {
                            ...commonPayload,
                            frequency: form.frequency,
                            expectedDate: form.expectedDate,
                        };

                await api.patch(
                    `/incomes/${editingIncome._id}`,
                    payload
                );

                setSuccess("Income updated successfully.");
            } else {
                await api.post("/incomes", {
                    ...commonPayload,
                    frequency: form.frequency,
                    expectedDate: form.expectedDate,
                });

                setSuccess("Expected income created successfully.");
            }

            setModalOpen(false);
            setEditingIncome(null);
            setForm(emptyForm);

            await fetchData();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to save the income record."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleReceive = async (income: Income) => {
        const confirmed = window.confirm(
            `Mark "${income.title}" (${formatCurrency(income.amount)}) as received? This will add the amount to ${getWalletName(income.walletId)}.`
        );

        if (!confirmed) return;

        try {
            setReceivingId(income._id);
            setError("");
            setSuccess("");

            await api.patch(`/incomes/${income._id}/receive`, {
                receivedDate: getToday(),
            });

            setSuccess(
                income.frequency === "monthly"
                    ? "Income received successfully. Your next monthly expected payment has been created."
                    : "Income received successfully. Your wallet balance has been updated."
            );

            await fetchData();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to mark this income as received."
            );
        } finally {
            setReceivingId("");
        }
    };

    const handleDelete = async (income: Income) => {
        const message =
            income.status === "received"
                ? `Delete "${income.title}" (${formatCurrency(income.amount)})?\n\nThis will also reverse the amount from ${getWalletName(income.walletId)} and delete its linked income transaction.`
                : `Delete the expected income record "${income.title}" (${formatCurrency(income.amount)})?`;

        const confirmed = window.confirm(message);

        if (!confirmed) return;

        try {
            setDeletingId(income._id);
            setError("");
            setSuccess("");

            await api.delete(`/incomes/${income._id}`);

            setSuccess("Income deleted successfully.");

            await fetchData();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to delete the income record."
            );
        } finally {
            setDeletingId("");
        }
    };

    const glassCard =
        "rounded-3xl border border-white/10 bg-white/[0.055] shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-2xl";

    return (
        <div className="space-y-8">

            {/* Page heading */}
            <section className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium tracking-wider text-violet-300">
                        MONEY MANAGEMENT
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Income Management
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        Track your expected income and manage received payments.
                    </p>
                </div>

                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 rounded-2xl border border-violet-300/20 bg-violet-500/20 px-5 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/30"
                >
                    <Plus size={18} />
                    Add Expected Income
                </button>
            </section>

            {/* Notifications */}
            {error && !modalOpen && (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                    {success}
                </div>
            )}

            {/* Summary cards */}
            <section className="grid gap-5 md:grid-cols-3">

                <div className={`${glassCard} p-6`}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-amber-200">
                            Expected Income
                        </p>
                        <Clock3 className="text-amber-300" />
                    </div>

                    <h2 className="mt-5 text-2xl font-bold text-white">
                        {formatCurrency(totals.expected)}
                    </h2>

                    <p className="mt-2 text-xs text-slate-400">
                        All pending income records
                    </p>
                </div>

                <div className={`${glassCard} p-6`}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-emerald-200">
                            Received Income
                        </p>
                        <ArrowDownLeft className="text-emerald-300" />
                    </div>

                    <h2 className="mt-5 text-2xl font-bold text-white">
                        {formatCurrency(totals.received)}
                    </h2>

                    <p className="mt-2 text-xs text-slate-400">
                        Total recorded received payments
                    </p>
                </div>

                <div className="rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-500/25 to-white/[0.04] p-6 backdrop-blur-2xl">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-violet-200">
                            Expected Monthly Income
                        </p>
                        <Repeat className="text-violet-200" />
                    </div>

                    <h2 className="mt-5 text-2xl font-bold text-white">
                        {formatCurrency(totals.monthly)}
                    </h2>

                    <p className="mt-2 text-xs text-slate-300">
                        Pending monthly income records
                    </p>
                </div>
            </section>

            {/* Filters */}
            <section className={`${glassCard} p-5`}>
                <div className="grid gap-4 md:grid-cols-3">

                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search income..."
                            className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-xl border border-white/10 bg-[#202A40] px-4 py-3 text-sm text-white outline-none"
                    >
                        <option value="all">All statuses</option>
                        <option value="expected">Expected</option>
                        <option value="received">Received</option>
                    </select>

                    <select
                        value={frequencyFilter}
                        onChange={(e) => setFrequencyFilter(e.target.value)}
                        className="rounded-xl border border-white/10 bg-[#202A40] px-4 py-3 text-sm text-white outline-none"
                    >
                        <option value="all">All frequencies</option>
                        <option value="one_time">One-time</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
            </section>

            {/* Income list */}
            <section className={`${glassCard} overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5 sm:p-6">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            Income Records
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            {filteredIncomes.length} record(s)
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
                    <div className="p-12 text-center text-slate-400">
                        Loading income records...
                    </div>
                ) : filteredIncomes.length === 0 ? (
                    <div className="p-12 text-center">
                        <CircleDollarSign
                            size={42}
                            className="mx-auto text-violet-300"
                        />

                        <h3 className="mt-4 font-semibold text-white">
                            No income records found
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                            Add expected income or adjust your filters.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left">
                            <thead className="bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Income</th>
                                    <th className="px-6 py-4">Frequency</th>
                                    <th className="px-6 py-4">Wallet</th>
                                    <th className="px-6 py-4">Expected Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-white/[0.06]">
                                {filteredIncomes.map((income) => (
                                    <tr
                                        key={income._id}
                                        className="transition hover:bg-white/[0.025]"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                                                    <TrendingUp size={19} />
                                                </div>

                                                <div>
                                                    <p className="font-medium text-white">
                                                        {income.title}
                                                    </p>

                                                    {income.description && (
                                                        <p className="mt-1 max-w-[180px] truncate text-xs text-slate-400">
                                                            {income.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="rounded-lg bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-300">
                                                {income.frequency === "monthly"
                                                    ? "Monthly"
                                                    : "One-time"}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-sm text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Wallet
                                                    size={15}
                                                    className="text-slate-400"
                                                />
                                                {getWalletName(income.walletId)}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays size={15} />
                                                {formatDate(
                                                    income.status === "received" && income.receivedDate
                                                        ? income.receivedDate
                                                        : income.expectedDate
                                                )}
                                            </div>

                                            {income.status === "received" && income.receivedDate && (
                                                <p className="mt-1 text-xs text-emerald-300">
                                                    Received payment
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            {income.status === "received" ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                                                    <CheckCircle2 size={14} />
                                                    Received
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300">
                                                    <Clock3 size={14} />
                                                    Expected
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-300">
                                            {formatCurrency(income.amount)}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(income)}
                                                    disabled={!!deletingId}
                                                    className="flex items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Pencil size={14} />
                                                    Edit
                                                </button>

                                                {income.status === "expected" && (
                                                    <button
                                                        onClick={() => handleReceive(income)}
                                                        disabled={!!receivingId || !!deletingId}
                                                        className="flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <CheckCircle2 size={15} />
                                                        {receivingId === income._id
                                                            ? "Processing..."
                                                            : "Mark Received"}
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleDelete(income)}
                                                    disabled={!!deletingId || !!receivingId}
                                                    className="flex items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Trash2 size={14} />
                                                    {deletingId === income._id
                                                        ? "Deleting..."
                                                        : "Delete"}
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

            {/* Add / Edit income modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-[#070B14]/90 p-4 backdrop-blur-xl">
                    <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-3xl border border-white/20 bg-[#171E30] p-6 shadow-[0_0_80px_rgba(139,92,246,0.15)] sm:p-8">

                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {editingIncome ? "Edit Income" : "Add Expected Income"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    {editingIncome
                                        ? "Update your income record details."
                                        : "Enter the details of your upcoming income."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Income Title
                                    </label>

                                    <input
                                        required
                                        maxLength={100}
                                        value={form.title}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                title: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. Monthly Salary"
                                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Amount (LKR)
                                    </label>

                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        required
                                        value={form.amount}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                amount: e.target.value,
                                            })
                                        }
                                        placeholder="0.00"
                                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
                                    />
                                </div>

                                {editingIncome?.status !== "received" && (
                                    <div>
                                        <label className="mb-2 block text-sm text-slate-300">
                                            Frequency
                                        </label>

                                        <select
                                            value={form.frequency}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    frequency: e.target.value as IncomeFrequency,
                                                })
                                            }
                                            className="w-full rounded-xl border border-white/10 bg-[#202A40] px-4 py-3 text-sm text-white outline-none"
                                        >
                                            <option value="one_time">One-time</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        {editingIncome?.status === "received"
                                            ? "Received Date"
                                            : "Expected Date"}
                                    </label>

                                    <input
                                        type="date"
                                        required
                                        value={form.expectedDate}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                expectedDate: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Receive Into Wallet
                                    </label>

                                    <select
                                        required
                                        value={form.walletId}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
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
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Description (Optional)
                                    </label>

                                    <textarea
                                        rows={3}
                                        maxLength={500}
                                        value={form.description}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                description: e.target.value,
                                            })
                                        }
                                        placeholder="Add some details..."
                                        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
                                    />
                                </div>
                            </div>

                            {editingIncome?.status !== "received" &&
                                form.frequency === "monthly" && (
                                    <div className="mt-5 rounded-xl border border-violet-300/15 bg-violet-500/10 p-4 text-sm text-violet-200">
                                        <div className="flex items-start gap-3">
                                            <Repeat size={18} className="mt-0.5 shrink-0" />
                                            <p>
                                                When you mark a monthly income as received,
                                                the system will automatically create the
                                                next expected monthly payment.
                                            </p>
                                        </div>
                                    </div>
                                )}

                            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/5"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        saving ||
                                        wallets.filter(
                                            (wallet) => wallet.type !== "credit_card"
                                        ).length === 0
                                    }
                                    className="rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingIncome
                                            ? "Save Changes"
                                            : "Create Income"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default IncomePage;
