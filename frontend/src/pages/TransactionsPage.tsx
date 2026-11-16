
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    ArrowLeftRight,
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
    Receipt,
    // Wallet,
    RefreshCw,
} from "lucide-react";

import api from "../services/api";

type TransactionType = "income" | "expense" | "transfer";

interface WalletOption {
    _id: string;
    name: string;
    type: string;
    currency: string;
}

interface CategoryOption {
    _id: string;
    name: string;
}

interface Transaction {
    _id: string;
    title: string;
    type: TransactionType;
    amount: number;
    walletId: WalletOption | string;
    destinationWalletId?: WalletOption | string;
    categoryId?: CategoryOption | string;
    description?: string;
    date: string;
}

interface TransactionForm {
    title: string;
    type: TransactionType;
    amount: string;
    walletId: string;
    destinationWalletId: string;
    categoryId: string;
    description: string;
    date: string;
}

const emptyForm: TransactionForm = {
    title: "",
    type: "expense",
    amount: "",
    walletId: "",
    destinationWalletId: "",
    categoryId: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: "LKR",
        minimumFractionDigits: 2,
    }).format(amount);

const getId = (value?: string | { _id: string }) =>
    typeof value === "string" ? value : value?._id || "";

const getName = (value?: string | { name: string }) =>
    typeof value === "string" ? "—" : value?.name || "—";

function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [wallets, setWallets] = useState<WalletOption[]>([]);
    const [categories, setCategories] = useState<CategoryOption[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] =
        useState<Transaction | null>(null);

    const [form, setForm] = useState<TransactionForm>(emptyForm);

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [walletFilter, setWalletFilter] = useState("all");

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [transactionResponse, walletResponse, categoryResponse] =
                await Promise.all([
                    api.get("/transactions"),
                    api.get("/wallets"),
                    api.get("/categories"),
                ]);

            setTransactions(
                transactionResponse.data.data || []
            );

            setWallets(walletResponse.data.data.wallets || []);
            setCategories(categoryResponse.data.categories || []);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to load transaction information."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totals = useMemo(() => {
        const income = transactions
            .filter((item) => item.type === "income")
            .reduce((sum, item) => sum + item.amount, 0);

        const expenses = transactions
            .filter((item) => item.type === "expense")
            .reduce((sum, item) => sum + item.amount, 0);

        return {
            income,
            expenses,
            net: income - expenses,
        };
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter((item) => {
                const matchesSearch =
                    item.title.toLowerCase().includes(search.toLowerCase());

                const matchesType =
                    typeFilter === "all" || item.type === typeFilter;

                const matchesWallet =
                    walletFilter === "all" ||
                    getId(item.walletId) === walletFilter ||
                    getId(item.destinationWalletId) === walletFilter;

                return matchesSearch && matchesType && matchesWallet;
            })
            .sort(
                (a, b) =>
                    new Date(b.date).getTime() -
                    new Date(a.date).getTime()
            );
    }, [transactions, search, typeFilter, walletFilter]);

    const openAddModal = () => {
        setEditingTransaction(null);
        setForm({
            ...emptyForm,
            date: new Date().toISOString().slice(0, 10),
        });
        setError("");
        setSuccess("");
        setModalOpen(true);
    };

    const openEditModal = (transaction: Transaction) => {
        setEditingTransaction(transaction);

        setForm({
            title: transaction.title,
            type: transaction.type,
            amount: String(transaction.amount),
            walletId: getId(transaction.walletId),
            destinationWalletId: getId(transaction.destinationWalletId),
            categoryId: getId(transaction.categoryId),
            description: transaction.description || "",
            date: new Date(transaction.date).toISOString().slice(0, 10),
        });

        setError("");
        setSuccess("");
        setModalOpen(true);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const payload: Record<string, unknown> = {
                title: form.title.trim(),
                type: form.type,
                amount: Number(form.amount),
                walletId: form.walletId,
                description: form.description.trim(),
                date: form.date,
            };

            if (form.type === "transfer") {
                payload.destinationWalletId = form.destinationWalletId;
            } else if (form.categoryId) {
                payload.categoryId = form.categoryId;
            }

            if (editingTransaction) {
                await api.put(
                    `/transactions/${editingTransaction._id}`,
                    payload
                );
                setSuccess("Transaction updated successfully.");
            } else {
                await api.post("/transactions", payload);
                setSuccess("Transaction added successfully.");
            }

            setModalOpen(false);
            setForm(emptyForm);
            await fetchData();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to save the transaction."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (transaction: Transaction) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${transaction.title}"?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await api.delete(`/transactions/${transaction._id}`);

            setSuccess("Transaction deleted successfully.");
            await fetchData();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to delete this transaction."
            );
        }
    };

    const getTypeIcon = (type: TransactionType) => {
        if (type === "income") return ArrowDownLeft;
        if (type === "expense") return ArrowUpRight;
        return ArrowLeftRight;
    };

    const getTypeStyle = (type: TransactionType) => {
        if (type === "income")
            return "bg-emerald-400/10 text-emerald-300";

        if (type === "expense")
            return "bg-rose-400/10 text-rose-300";

        return "bg-blue-400/10 text-blue-300";
    };

    const glassCard =
        "rounded-3xl border border-white/10 bg-white/[0.055] shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-2xl";

    return (
        <div className="space-y-8">

            {/* Heading */}
            <section className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium tracking-wider text-violet-300">
                        FINANCIAL ACTIVITY
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Transactions
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        Manage your income, expenses and wallet transfers.
                    </p>
                </div>

                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 rounded-2xl border border-violet-300/20 bg-violet-500/20 px-5 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/30"
                >
                    <Plus size={18} />
                    Add Transaction
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

            {/* Overview */}
            <section className="grid gap-5 md:grid-cols-3">

                <div className={`${glassCard} p-6`}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-emerald-200">
                            Total Income
                        </p>
                        <ArrowDownLeft className="text-emerald-300" />
                    </div>

                    <h2 className="mt-5 text-2xl font-bold text-white">
                        {formatCurrency(totals.income)}
                    </h2>
                </div>

                <div className={`${glassCard} p-6`}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-rose-200">
                            Total Expenses
                        </p>
                        <ArrowUpRight className="text-rose-300" />
                    </div>

                    <h2 className="mt-5 text-2xl font-bold text-white">
                        {formatCurrency(totals.expenses)}
                    </h2>
                </div>

                <div className="rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-500/25 to-white/[0.04] p-6 backdrop-blur-2xl">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-violet-200">
                            Net Income
                        </p>
                        <Receipt className="text-violet-200" />
                    </div>

                    <h2 className="mt-5 text-2xl font-bold text-white">
                        {formatCurrency(totals.net)}
                    </h2>
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
                            placeholder="Search transactions..."
                            className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
                        />
                    </div>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="rounded-xl border border-white/10 bg-[#202A40] px-4 py-3 text-sm text-white outline-none"
                    >
                        <option value="all">All transaction types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expenses</option>
                        <option value="transfer">Transfers</option>
                    </select>

                    <select
                        value={walletFilter}
                        onChange={(e) => setWalletFilter(e.target.value)}
                        className="rounded-xl border border-white/10 bg-[#202A40] px-4 py-3 text-sm text-white outline-none"
                    >
                        <option value="all">All wallets</option>
                        {wallets.map((wallet) => (
                            <option key={wallet._id} value={wallet._id}>
                                {wallet.name}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {/* Transaction List */}
            <section className={`${glassCard} overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5 sm:p-6">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            Recent Transactions
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            {filteredTransactions.length} transaction(s)
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
                        Loading transactions...
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="p-12 text-center">
                        <Receipt
                            size={42}
                            className="mx-auto text-violet-300"
                        />

                        <h3 className="mt-4 font-semibold text-white">
                            No transactions found
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                            Add a transaction or adjust your filters.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px] text-left">
                            <thead className="bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Transaction</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Wallet</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-white/[0.06]">
                                {filteredTransactions.map((transaction) => {
                                    const Icon = getTypeIcon(transaction.type);

                                    return (
                                        <tr
                                            key={transaction._id}
                                            className="transition hover:bg-white/[0.025]"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${getTypeStyle(transaction.type)}`}>
                                                        <Icon size={19} />
                                                    </div>

                                                    <div>
                                                        <p className="font-medium text-white">
                                                            {transaction.title}
                                                        </p>

                                                        {transaction.description && (
                                                            <p className="mt-1 max-w-[180px] truncate text-xs text-slate-400">
                                                                {transaction.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${getTypeStyle(transaction.type)}`}>
                                                    {transaction.type}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-300">
                                                {getName(transaction.walletId)}
                                                {transaction.type === "transfer" && (
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        To: {getName(transaction.destinationWalletId)}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-400">
                                                {transaction.type === "transfer"
                                                    ? "—"
                                                    : getName(transaction.categoryId)}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-400">
                                                {new Date(transaction.date).toLocaleDateString("en-LK")}
                                            </td>

                                            <td className={`px-6 py-4 text-right text-sm font-semibold ${
                                                transaction.type === "income"
                                                    ? "text-emerald-300"
                                                    : transaction.type === "expense"
                                                        ? "text-rose-300"
                                                        : "text-blue-300"
                                            }`}>
                                                {transaction.type === "income" ? "+" : transaction.type === "expense" ? "−" : ""}
                                                {formatCurrency(transaction.amount)}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => openEditModal(transaction)}
                                                        title="Edit transaction"
                                                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(transaction)}
                                                        title="Delete transaction"
                                                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-[#070B14]/90 p-4 backdrop-blur-xl">
                    <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-3xl border border-white/20 bg-[#171E30] p-6 shadow-[0_0_80px_rgba(139,92,246,0.15)] sm:p-8">

                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {editingTransaction
                                        ? "Edit Transaction"
                                        : "Add New Transaction"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    Enter your transaction details.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
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

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Transaction Title
                                    </label>
                                    <input
                                        required
                                        maxLength={100}
                                        value={form.title}
                                        onChange={(e) =>
                                            setForm({ ...form, title: e.target.value })
                                        }
                                        placeholder="e.g. Grocery shopping"
                                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Transaction Type
                                    </label>
                                    <select
                                        value={form.type}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                type: e.target.value as TransactionType,
                                                categoryId: "",
                                                destinationWalletId: "",
                                            })
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-[#202A40] px-4 py-3 text-sm text-white outline-none"
                                    >
                                        <option value="income">Income</option>
                                        <option value="expense">Expense</option>
                                        <option value="transfer">Transfer</option>
                                    </select>
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
                                            setForm({ ...form, amount: e.target.value })
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
                                        value={form.date}
                                        onChange={(e) =>
                                            setForm({ ...form, date: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        {form.type === "transfer"
                                            ? "From Wallet"
                                            : "Wallet"}
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
                                        <option value="">Select wallet</option>
                                        {wallets.map((wallet) => (
                                            <option
                                                key={wallet._id}
                                                value={wallet._id}
                                            >
                                                {wallet.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {form.type === "transfer" ? (
                                    <div>
                                        <label className="mb-2 block text-sm text-slate-300">
                                            To Wallet
                                        </label>
                                        <select
                                            required
                                            value={form.destinationWalletId}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    destinationWalletId: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-xl border border-white/10 bg-[#202A40] px-4 py-3 text-sm text-white outline-none"
                                        >
                                            <option value="">Select destination</option>
                                            {wallets
                                                .filter((wallet) => wallet._id !== form.walletId)
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
                                ) : (
                                    <div>
                                        <label className="mb-2 block text-sm text-slate-300">
                                            Category
                                        </label>
                                        <select
                                            value={form.categoryId}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    categoryId: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-xl border border-white/10 bg-[#202A40] px-4 py-3 text-sm text-white outline-none"
                                        >
                                            <option value="">Select category (optional)</option>
                                            {categories.map((category) => (
                                                <option
                                                    key={category._id}
                                                    value={category._id}
                                                >
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

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

                            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
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
                                        : editingTransaction
                                            ? "Save Changes"
                                            : "Create Transaction"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TransactionsPage;
