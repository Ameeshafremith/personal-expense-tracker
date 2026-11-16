
import { useState } from "react";
import type { FormEvent } from "react";
import {
    Calculator,
    Wallet,
    TrendingUp,
    TrendingDown,
    CalendarDays,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    RotateCcw,
} from "lucide-react";

import api from "../services/api";

interface SimulationResult {
    purchaseName: string;
    purchaseAmount: number;
    currentAvailableMoney: number;
    remainingAmount: number;
    averageMonthlyIncome: number;
    averageMonthlyExpenses: number;
    expectedMonthlySavings: number;
    estimatedMonths: number;
    estimatedPurchaseDate: string;
    canAffordNow: boolean;
    affordableInFuture: boolean;
    message: string;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: "LKR",
        minimumFractionDigits: 2,
    }).format(amount);

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-LK", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

function SimulatorPage() {
    const [purchaseName, setPurchaseName] = useState("");
    const [purchaseAmount, setPurchaseAmount] = useState("");
    const [simulation, setSimulation] =
        useState<SimulationResult | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const glassCard =
        "rounded-3xl border border-white/10 bg-white/[0.055] shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-2xl";

    const handleSimulation = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        try {
            setLoading(true);
            setError("");
            setSimulation(null);

            const response = await api.post("/simulator/simulate", {
                purchaseName: purchaseName.trim(),
                purchaseAmount: Number(purchaseAmount),
            });

            setSimulation(response.data.data);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to complete the purchase simulation. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const resetSimulation = () => {
        setPurchaseName("");
        setPurchaseAmount("");
        setSimulation(null);
        setError("");
    };

    return (
        <div className="space-y-8">

            {/* Page Heading */}
            <section>
                <p className="text-sm font-medium tracking-wider text-violet-300">
                    FINANCIAL PLANNING
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Financial Simulator
                </h1>

                <p className="mt-2 text-sm text-slate-400">
                    Discover whether you can afford a purchase now or estimate
                    how long you may need to save.
                </p>
            </section>

            {/* Simulator Form */}
            <section className={`${glassCard} p-6 sm:p-8`}>
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
                        <Calculator size={24} />
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            Purchase Details
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Enter the purchase you are planning.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                        <AlertCircle size={19} className="mt-0.5 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSimulation}>
                    <div className="grid gap-5 md:grid-cols-2">

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Purchase Name
                            </label>

                            <input
                                type="text"
                                required
                                maxLength={100}
                                value={purchaseName}
                                onChange={(e) =>
                                    setPurchaseName(e.target.value)
                                }
                                placeholder="e.g. New Laptop"
                                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-violet-400/50"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Purchase Amount (LKR)
                            </label>

                            <input
                                type="number"
                                required
                                min="0.01"
                                step="0.01"
                                value={purchaseAmount}
                                onChange={(e) =>
                                    setPurchaseAmount(e.target.value)
                                }
                                placeholder="e.g. 150000"
                                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-violet-400/50"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Sparkles size={18} />
                            {loading ? "Calculating..." : "Simulate Purchase"}
                        </button>

                        <button
                            type="button"
                            onClick={resetSimulation}
                            className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/5"
                        >
                            <RotateCcw size={16} />
                            Reset
                        </button>
                    </div>
                </form>
            </section>

            {/* Simulation Results */}
            {simulation && (
                <section className="space-y-6">

                    {/* Affordability Status */}
                    <div className={`rounded-3xl border p-6 sm:p-8 ${
                        simulation.canAffordNow
                            ? "border-emerald-300/20 bg-gradient-to-br from-emerald-500/15 to-white/[0.04]"
                            : simulation.affordableInFuture
                                ? "border-blue-300/20 bg-gradient-to-br from-blue-500/15 to-white/[0.04]"
                                : "border-amber-300/20 bg-gradient-to-br from-amber-500/15 to-white/[0.04]"
                    }`}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-slate-300">
                                    Simulation Result
                                </p>

                                <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                                    {simulation.purchaseName}
                                </h2>

                                <p className="mt-2 text-sm text-slate-400">
                                    Purchase amount: {formatCurrency(simulation.purchaseAmount)}
                                </p>
                            </div>

                            {simulation.canAffordNow ? (
                                <CheckCircle2
                                    size={38}
                                    className="text-emerald-300"
                                />
                            ) : (
                                <TrendingUp
                                    size={38}
                                    className="text-blue-300"
                                />
                            )}
                        </div>

                        <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-5">
                            <p className="text-sm font-semibold text-white">
                                {simulation.canAffordNow
                                    ? "Affordable Now"
                                    : simulation.affordableInFuture
                                        ? "Estimated Future Affordability"
                                        : "Not Currently Affordable"}
                            </p>

                            <p className="mt-2 text-sm leading-relaxed text-slate-300">
                                {simulation.message}
                            </p>
                        </div>

                        {!simulation.canAffordNow &&
                            simulation.affordableInFuture && (
                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Estimated saving period
                                        </p>

                                        <p className="mt-1 text-2xl font-bold text-white">
                                            {simulation.estimatedMonths} months
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Estimated purchase date
                                        </p>

                                        <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-white">
                                            <CalendarDays
                                                size={18}
                                                className="text-blue-300"
                                            />
                                            {formatDate(simulation.estimatedPurchaseDate)}
                                        </p>
                                    </div>
                                </div>
                            )}
                    </div>

                    {/* Financial Overview */}
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

                        <div className={`${glassCard} p-6`}>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-violet-200">
                                    Available Money
                                </p>
                                <Wallet className="text-violet-300" />
                            </div>

                            <h3 className="mt-5 text-2xl font-bold text-white">
                                {formatCurrency(simulation.currentAvailableMoney)}
                            </h3>

                            <p className="mt-2 text-xs text-slate-400">
                                Currently available funds
                            </p>
                        </div>

                        <div className={`${glassCard} p-6`}>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-emerald-200">
                                    Average Monthly Income
                                </p>
                                <TrendingUp className="text-emerald-300" />
                            </div>

                            <h3 className="mt-5 text-2xl font-bold text-white">
                                {formatCurrency(simulation.averageMonthlyIncome)}
                            </h3>

                            <p className="mt-2 text-xs text-slate-400">
                                Average monthly income
                            </p>
                        </div>

                        <div className={`${glassCard} p-6`}>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-rose-200">
                                    Average Monthly Expenses
                                </p>
                                <TrendingDown className="text-rose-300" />
                            </div>

                            <h3 className="mt-5 text-2xl font-bold text-white">
                                {formatCurrency(simulation.averageMonthlyExpenses)}
                            </h3>

                            <p className="mt-2 text-xs text-slate-400">
                                Average monthly expenses
                            </p>
                        </div>

                        <div className={`${glassCard} p-6`}>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-blue-200">
                                    Expected Monthly Savings
                                </p>
                                <Sparkles className="text-blue-300" />
                            </div>

                            <h3 className="mt-5 text-2xl font-bold text-white">
                                {formatCurrency(simulation.expectedMonthlySavings)}
                            </h3>

                            <p className="mt-2 text-xs text-slate-400">
                                Estimated monthly savings
                            </p>
                        </div>

                        <div className={`${glassCard} p-6`}>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-amber-200">
                                    Remaining Amount
                                </p>
                                <Calculator className="text-amber-300" />
                            </div>

                            <h3 className="mt-5 text-2xl font-bold text-white">
                                {formatCurrency(simulation.remainingAmount)}
                            </h3>

                            <p className="mt-2 text-xs text-slate-400">
                                Amount needed for this purchase
                            </p>
                        </div>

                        <div className={`${glassCard} p-6`}>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-cyan-200">
                                    Estimated Waiting Period
                                </p>
                                <CalendarDays className="text-cyan-300" />
                            </div>

                            <h3 className="mt-5 text-2xl font-bold text-white">
                                {simulation.canAffordNow
                                    ? "0 months"
                                    : simulation.affordableInFuture
                                        ? `${simulation.estimatedMonths} months`
                                        : "Unavailable"}
                            </h3>

                            <p className="mt-2 text-xs text-slate-400">
                                Based on the simulation
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* Initial Information */}
            {!simulation && !loading && (
                <section className={`${glassCard} p-8 text-center`}>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
                        <Calculator size={32} />
                    </div>

                    <h2 className="mt-5 text-lg font-semibold text-white">
                        Plan Before You Purchase
                    </h2>

                    <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-400">
                        Enter a purchase name and amount to analyse your
                        current available funds, income, expenses and
                        estimated savings period.
                    </p>
                </section>
            )}
        </div>
    );
}

export default SimulatorPage;
