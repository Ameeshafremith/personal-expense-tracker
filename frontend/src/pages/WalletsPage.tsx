
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";

import {
    Wallet,
    Plus,
    Pencil,
    Trash2,
    X,
    Banknote,
    CreditCard,
    Smartphone,
    Landmark,
    CircleDollarSign,
} from "lucide-react";

import api from "../services/api";

type WalletType =
    | "cash"
    | "bank_account"
    | "credit_card"
    | "digital_wallet";

interface WalletData {
    _id: string;
    name: string;
    type: WalletType;
    institutionName?: string;
    accountNickname?: string;
    lastFourDigits?: string;
    openingBalance: number;
    currentBalance: number;
    creditLimit?: number;
    outstandingBalance?: number;
    currency: string;
}

interface WalletFormData {
    name: string;
    type: WalletType;
    institutionName: string;
    accountNickname: string;
    lastFourDigits: string;
    openingBalance: string;
    creditLimit: string;
    currency: string;
}

const initialForm: WalletFormData = {
    name: "",
    type: "cash",
    institutionName: "",
    accountNickname: "",
    lastFourDigits: "",
    openingBalance: "0",
    creditLimit: "",
    currency: "LKR",
};

const walletTypes = [
    { value: "cash", label: "Cash", icon: Banknote },
    { value: "bank_account", label: "Bank Account", icon: Landmark },
    { value: "credit_card", label: "Credit Card", icon: CreditCard },
    { value: "digital_wallet", label: "Digital Wallet", icon: Smartphone },
];

function formatCurrency(amount: number, currency = "LKR") {
    return new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

function WalletsPage() {
    const [wallets, setWallets] = useState<WalletData[]>([]);
    const [totalAvailableMoney, setTotalAvailableMoney] = useState(0);
    const [totalAvailableCredit, setTotalAvailableCredit] = useState(0);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingWallet, setEditingWallet] = useState<WalletData | null>(null);
    const [form, setForm] = useState<WalletFormData>(initialForm);

    // Fetch wallets
    const fetchWallets = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/wallets");

            // Backend response shape: { success, data: { wallets, totals } }
            const walletData = response.data?.data ?? {};
            const walletList: WalletData[] = Array.isArray(walletData.wallets)
                ? walletData.wallets
                : [];

            setWallets(walletList);

            setTotalAvailableMoney(
                walletData.totalAvailableMoney ??
                walletList
                    .filter((wallet) => wallet.type !== "credit_card")
                    .reduce(
                        (sum, wallet) => sum + wallet.currentBalance,
                        0
                    )
            );

            setTotalAvailableCredit(
                walletData.totalAvailableCredit ??
                walletList
                    .filter((wallet) => wallet.type === "credit_card")
                    .reduce(
                        (sum, wallet) =>
                            sum + Math.max(
                                0,
                                (wallet.creditLimit || 0) -
                                (wallet.outstandingBalance || 0)
                            ),
                        0
                    )
            );
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to load your wallets."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallets();
    }, []);

    // Open Add Modal
    const openAddModal = () => {
        setEditingWallet(null);
        setForm(initialForm);
        setError("");
        setSuccess("");
        setModalOpen(true);
    };

    // Open Edit Modal
    const openEditModal = (wallet: WalletData) => {
        setEditingWallet(wallet);

        setForm({
            name: wallet.name,
            type: wallet.type,
            institutionName: wallet.institutionName || "",
            accountNickname: wallet.accountNickname || "",
            lastFourDigits: wallet.lastFourDigits || "",
            openingBalance: String(wallet.openingBalance),
            creditLimit: String(wallet.creditLimit ?? ""),
            currency: wallet.currency || "LKR",
        });

        setError("");
        setSuccess("");
        setModalOpen(true);
    };

    // Submit Wallet Form
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const payload: Record<string, unknown> = {
                name: form.name.trim(),
                type: form.type,
                institutionName: form.institutionName.trim(),
                accountNickname: form.accountNickname.trim(),
                lastFourDigits: form.lastFourDigits.trim(),
                currency: form.currency,
            };

            if (!editingWallet) {
                payload.openingBalance = Number(form.openingBalance);
            }

            if (form.type === "credit_card") {
                payload.creditLimit = Number(form.creditLimit);
            }

            if (editingWallet) {
                await api.put(
                    `/wallets/${editingWallet._id}`,
                    payload
                );

                setSuccess("Wallet updated successfully.");
            } else {
                await api.post("/wallets", payload);

                setSuccess("Wallet created successfully.");
            }

            setModalOpen(false);
            setForm(initialForm);

            await fetchWallets();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to save the wallet."
            );
        } finally {
            setSaving(false);
        }
    };

    // Delete Wallet
    const handleDelete = async (wallet: WalletData) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${wallet.name}"?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await api.delete(`/wallets/${wallet._id}`);

            setSuccess("Wallet deleted successfully.");

            await fetchWallets();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to delete this wallet."
            );
        }
    };

    // Wallet Icon
    const getWalletIcon = (type: WalletType) => {
        switch (type) {
            case "cash":
                return Banknote;
            case "bank_account":
                return Landmark;
            case "credit_card":
                return CreditCard;
            case "digital_wallet":
                return Smartphone;
        }
    };

    // Wallet Type Label
    const getWalletTypeLabel = (type: WalletType) => {
        return walletTypes.find(
            (item) => item.value === type
        )?.label || type;
    };

    const glassCard =
        "rounded-3xl border border-white/10 bg-white/[0.055] shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-2xl";

    return (
        <div className="space-y-8">

            {/* Page Heading */}
            <section className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium tracking-wider text-violet-300">
                        FINANCIAL ACCOUNTS
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                        My Wallets
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        Manage your cash, bank accounts and digital wallets.
                    </p>
                </div>

                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 rounded-2xl border border-violet-300/20 bg-violet-500/20 px-5 py-3 text-sm font-semibold text-violet-100 shadow-lg shadow-violet-950/20 transition hover:bg-violet-500/30"
                >
                    <Plus size={18} />
                    Add Wallet
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

            {/* Balance Overview */}
            <section className="grid gap-5 md:grid-cols-2">

                <div className="rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-500/25 via-violet-500/10 to-white/[0.04] p-6 shadow-xl shadow-violet-950/20 backdrop-blur-2xl">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-violet-200">
                            Total Available Money
                        </p>

                        <CircleDollarSign
                            className="text-violet-200"
                            size={24}
                        />
                    </div>

                    <h2 className="mt-5 text-3xl font-bold">
                        {formatCurrency(totalAvailableMoney)}
                    </h2>

                    <p className="mt-3 text-xs text-slate-300">
                        Cash, bank accounts and digital wallets
                    </p>
                </div>

                <div className={`${glassCard} p-6`}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-blue-200">
                            Available Credit
                        </p>

                        <CreditCard
                            className="text-blue-200"
                            size={24}
                        />
                    </div>

                    <h2 className="mt-5 text-3xl font-bold">
                        {formatCurrency(totalAvailableCredit)}
                    </h2>

                    <p className="mt-3 text-xs text-slate-400">
                        Credit limit remaining · Not included in available money
                    </p>
                </div>
            </section>

            {/* Wallet List */}
            <section>
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Your Accounts
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            {wallets.length} wallet{wallets.length === 1 ? "" : "s"} registered
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className={`${glassCard} p-10 text-center text-slate-400`}>
                        Loading your wallets...
                    </div>
                ) : wallets.length === 0 ? (
                    <div className={`${glassCard} p-12 text-center`}>
                        <Wallet
                            className="mx-auto text-violet-300"
                            size={42}
                        />

                        <h3 className="mt-4 text-lg font-semibold">
                            No wallets yet
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                            Add your first wallet to start managing your money.
                        </p>

                        <button
                            onClick={openAddModal}
                            className="mt-6 rounded-xl bg-violet-500/20 px-5 py-3 text-sm font-semibold text-violet-200 hover:bg-violet-500/30"
                        >
                            Add your first wallet
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {wallets.map((wallet) => {
                            const Icon = getWalletIcon(wallet.type);
                            const isCreditCard = wallet.type === "credit_card";

                            return (
                                <div
                                    key={wallet._id}
                                    className={`${glassCard} group p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-300/25 hover:bg-white/[0.08]`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-violet-200">
                                                <Icon size={23} />
                                            </div>

                                            <div>
                                                <h3 className="font-semibold">
                                                    {wallet.name}
                                                </h3>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    {getWalletTypeLabel(wallet.type)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => openEditModal(wallet)}
                                                title="Edit wallet"
                                                className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                                            >
                                                <Pencil size={17} />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(wallet)}
                                                title="Delete wallet"
                                                className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-7">
                                        <p className="text-xs text-slate-400">
                                            {isCreditCard
                                                ? "Outstanding Balance"
                                                : "Current Balance"}
                                        </p>

                                        <h2 className="mt-2 text-2xl font-bold">
                                            {formatCurrency(
                                                isCreditCard
                                                    ? wallet.outstandingBalance || 0
                                                    : wallet.currentBalance,
                                                wallet.currency
                                            )}
                                        </h2>
                                    </div>

                                    {isCreditCard && (
                                        <div className="mt-4 border-t border-white/10 pt-4">
                                            <p className="text-xs text-slate-400">
                                                Available Credit
                                            </p>

                                            <p className="mt-1 font-semibold text-blue-200">
                                                {formatCurrency(
                                                    Math.max(
                                                        0,
                                                        (wallet.creditLimit || 0) -
                                                        (wallet.outstandingBalance || 0)
                                                    ),
                                                    wallet.currency
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    {(wallet.institutionName || wallet.lastFourDigits) && (
                                        <div className="mt-4 border-t border-white/10 pt-4 text-xs text-slate-400">
                                            {wallet.institutionName && (
                                                <p>{wallet.institutionName}</p>
                                            )}

                                            {wallet.lastFourDigits && (
                                                <p className="mt-1">
                                                    Account ending in •••• {wallet.lastFourDigits}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            
            {/* Add/Edit Wallet Modal */}
            {modalOpen && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-[#070B14]/90 p-4 backdrop-blur-xl">

                    <div className="relative my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/20 bg-[#171E30] p-6 shadow-[0_0_80px_rgba(139,92,246,0.15)] sm:p-8">

                        {/* Modal Heading */}
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {editingWallet ? "Edit Wallet" : "Add New Wallet"}
                                </h2>
                                <p className="mt-1 text-sm text-slate-400">
                                    Enter your wallet details below.
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

                        {/* Modal Error */}
                        {error && (
                            <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                                {error}
                            </div>
                        )}

                        {/* Wallet Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                {/* Wallet Name */}
                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Wallet Name
                                    </label>
                                    <input
                                        required
                                        maxLength={60}
                                        value={form.name}
                                        onChange={(e) =>
                                            setForm({ ...form, name: e.target.value })
                                        }
                                        placeholder="e.g. Cash on Hand"
                                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
                                    />
                                </div>

                                {/* Wallet Type */}
                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Wallet Type
                                    </label>
                                    <select
                                        value={form.type}
                                        disabled={!!editingWallet}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                type: e.target.value as WalletType,
                                            })
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-[#202A40] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50 disabled:opacity-60"
                                    >
                                        {walletTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Institution Name */}
                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Institution Name
                                    </label>
                                    <input
                                        value={form.institutionName}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                institutionName: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. Sampath Bank"
                                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
                                    />
                                </div>

                                {/* Account Nickname */}
                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Account Nickname
                                    </label>
                                    <input
                                        value={form.accountNickname}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                accountNickname: e.target.value,
                                            })
                                        }
                                        placeholder="Optional"
                                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
                                    />
                                </div>

                                {/* Last Four Digits */}
                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Last 4 Digits (Optional)
                                    </label>
                                    <input
                                        maxLength={4}
                                        inputMode="numeric"
                                        pattern="[0-9]{4}"
                                        value={form.lastFourDigits}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                lastFourDigits: e.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 4),
                                            })
                                        }
                                        placeholder="1234"
                                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
                                    />
                                </div>

                                {/* Opening Balance */}
                                {!editingWallet && (
                                    <div>
                                        <label className="mb-2 block text-sm text-slate-300">
                                            {form.type === "credit_card"
                                                ? "Opening Outstanding Balance"
                                                : "Opening Balance"}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            required
                                            value={form.openingBalance}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    openingBalance: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
                                        />
                                    </div>
                                )}

                                {/* Credit Limit */}
                                {form.type === "credit_card" && (
                                    <div className="sm:col-span-2">
                                        <label className="mb-2 block text-sm text-slate-300">
                                            Credit Limit
                                        </label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            required
                                            value={form.creditLimit}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    creditLimit: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
                                        />
                                    </div>
                                )}

                            </div>

                            {/* Form Buttons */}
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
                                        : editingWallet
                                            ? "Save Changes"
                                            : "Create Wallet"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default WalletsPage;
