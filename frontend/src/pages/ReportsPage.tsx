
import { useEffect, useState } from "react";
import {
    FileText,
    Download,
    CalendarDays,
    Sparkles,
    CheckCircle2,
    TrendingUp,
    TrendingDown,
    Wallet,
    PiggyBank,
    Award,
    BarChart3,
    RefreshCw,
} from "lucide-react";
import api from "../services/api";

interface MonthlyBreakdown {
    year: number;
    month: number;
    monthName: string;
    income: number;
    expenses: number;
    net: number;
    savingsContributions: number;
    transactionCount: number;
    contributionCount: number;
}

interface FinancialYearData {
    financialYear: {
        startYear: number;
        endYear: number;
        startMonth: number;
        startDate: string;
        endDate: string;
    };
    totals: {
        income: number;
        expenses: number;
        netIncome: number;
        totalSavingsContributions: number;
        incomeCount: number;
        expenseCount: number;
        contributionCount: number;
    };
    highestSpendingCategory: {
        categoryId: string | null;
        categoryName: string;
        amount: number;
        transactionCount: number;
    };
    highestSpendingMonth: {
        year: number;
        month: number;
        monthName: string;
        amount: number;
    };
    monthlyBreakdown: MonthlyBreakdown[];
}

function ReportsPage() {
    // PDF report states
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Financial year states
    const currentFinancialYear = new Date().getFullYear();

    const [selectedYear, setSelectedYear] = useState(
        currentFinancialYear
    );
    const [financialData, setFinancialData] =
        useState<FinancialYearData | null>(null);
    const [financialLoading, setFinancialLoading] = useState(true);
    const [financialError, setFinancialError] = useState("");

    const glassCard =
        "rounded-3xl border border-white/10 bg-white/[0.055] shadow-[0_8px_32px_rgba(0,0,0,0.20)] backdrop-blur-2xl";

    const formatCurrency = (amount: number) =>
        `LKR ${amount.toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    // Fetch financial year summary
    useEffect(() => {
        const fetchFinancialYear = async () => {
            try {
                setFinancialLoading(true);
                setFinancialError("");
                setFinancialData(null);

                const response = await api.get("/financial-year", {
                    params: {
                        year: selectedYear,
                    },
                });

                setFinancialData(response.data.data);
            } catch (err: any) {
                setFinancialError(
                    err.response?.data?.message ||
                    "Unable to load the financial year summary."
                );
            } finally {
                setFinancialLoading(false);
            }
        };

        fetchFinancialYear();
    }, [selectedYear]);

    // Generate available financial years
    const financialYears = Array.from(
        { length: 6 },
        (_, index) => currentFinancialYear - index
    );

    // PDF report generation - existing functionality preserved
    const handleGenerateReport = async () => {
        setError("");
        setSuccess("");

        if (!startDate || !endDate) {
            setError("Please select both start and end dates.");
            return;
        }

        if (startDate > endDate) {
            setError("Start date cannot be later than end date.");
            return;
        }

        try {
            setLoading(true);

            const response = await api.get("/reports/pdf", {
                params: {
                    startDate,
                    endDate,
                },
                responseType: "blob",
            });

            const pdfBlob = new Blob([response.data], {
                type: "application/pdf",
            });

            const downloadUrl = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");

            link.href = downloadUrl;
            link.download = `expense-report-${startDate}-to-${endDate}.pdf`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(downloadUrl);

            setSuccess(
                "Your expense report has been generated and downloaded successfully."
            );
        } catch (err: any) {
            let message = "Unable to generate the report. Please try again.";

            if (err.response?.data instanceof Blob) {
                try {
                    const errorData = JSON.parse(
                        await err.response.data.text()
                    );

                    message = errorData.message || message;
                } catch {
                    // Keep the default error message.
                }
            } else {
                message = err.response?.data?.message || message;
            }

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // Find the highest value for chart scaling
    const maxChartValue = Math.max(
        ...(financialData?.monthlyBreakdown || []).flatMap((month) => [
            month.income,
            month.expenses,
        ]),
        1
    );

    return (
        <div className="relative space-y-8">

            {/* Background lighting */}
            <div className="pointer-events-none absolute -right-20 top-10 -z-10 h-72 w-72 rounded-full bg-violet-600/10 blur-[110px]" />
            <div className="pointer-events-none absolute -left-20 top-96 -z-10 h-64 w-64 rounded-full bg-indigo-600/[0.08] blur-[100px]" />

            {/* Page heading */}
            <section>
                <p className="text-sm font-medium tracking-wide text-violet-300">
                    FINANCIAL OVERVIEW
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                    Reports
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    Review your yearly financial performance and generate
                    detailed expense reports for any selected period.
                </p>
            </section>

            {/* FINANCIAL YEAR SUMMARY */}
            <section className={`${glassCard} overflow-hidden`}>

                <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-400 to-blue-400" />

                {/* Summary heading */}
                <div className="flex flex-col gap-5 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-violet-300/20 bg-gradient-to-br from-violet-500/20 to-indigo-500/10">
                            <BarChart3
                                size={27}
                                className="text-violet-300"
                            />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold">
                                Financial Year Summary
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Track your income, expenses and savings.
                            </p>
                        </div>
                    </div>

                    {/* Financial year selector */}
                    <div className="w-full sm:w-52">
                        <label
                            htmlFor="financialYear"
                            className="mb-2 block text-xs font-medium text-slate-400"
                        >
                            Select Financial Year
                        </label>

                        <select
                            id="financialYear"
                            value={selectedYear}
                            onChange={(e) =>
                                setSelectedYear(Number(e.target.value))
                            }
                            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                        >
                            {financialYears.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>

                        <p className="mt-2 text-xs text-slate-500">
                            January – December
                        </p>
                    </div>
                </div>

                <div className="space-y-7 p-6 sm:p-8">

                    {/* Loading */}
                    {financialLoading && (
                        <div className="flex min-h-52 flex-col items-center justify-center gap-3">
                            <RefreshCw
                                size={28}
                                className="animate-spin text-violet-400"
                            />
                            <p className="text-sm text-slate-400">
                                Loading financial summary...
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {!financialLoading && financialError && (
                        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5">
                            <p className="text-sm text-rose-300">
                                {financialError}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedYear((year) => year)
                                }
                                className="mt-3 text-sm font-semibold text-violet-300 hover:text-violet-200"
                            >
                                Please change the selected year to retry.
                            </button>
                        </div>
                    )}

                    {!financialLoading && financialData && (
                        <>
                            {/* Financial year label */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                        Reporting period
                                    </p>

                                    <h3 className="mt-1 text-lg font-semibold text-white">
                                        {financialData.financialYear.startYear}
                                        {" – "}
                                        {financialData.financialYear.endYear}
                                    </h3>
                                </div>

                                <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                                    January – December
                                </span>
                            </div>

                            {/* Summary cards */}
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                                {/* Income */}
                                <div className="rounded-2xl border border-emerald-400/15 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                                            <TrendingUp
                                                size={20}
                                                className="text-emerald-400"
                                            />
                                        </div>

                                        <span className="text-xs text-emerald-300">
                                            Income
                                        </span>
                                    </div>

                                    <p className="mt-5 text-xs text-slate-400">
                                        Total Income
                                    </p>

                                    <h3 className="mt-1 break-words text-xl font-bold text-white">
                                        {formatCurrency(
                                            financialData.totals.income
                                        )}
                                    </h3>

                                    <p className="mt-2 text-xs text-slate-500">
                                        {financialData.totals.incomeCount} transactions
                                    </p>
                                </div>

                                {/* Expenses */}
                                <div className="rounded-2xl border border-rose-400/15 bg-gradient-to-br from-rose-500/10 to-transparent p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15">
                                            <TrendingDown
                                                size={20}
                                                className="text-rose-400"
                                            />
                                        </div>

                                        <span className="text-xs text-rose-300">
                                            Expenses
                                        </span>
                                    </div>

                                    <p className="mt-5 text-xs text-slate-400">
                                        Total Expenses
                                    </p>

                                    <h3 className="mt-1 break-words text-xl font-bold text-white">
                                        {formatCurrency(
                                            financialData.totals.expenses
                                        )}
                                    </h3>

                                    <p className="mt-2 text-xs text-slate-500">
                                        {financialData.totals.expenseCount} transactions
                                    </p>
                                </div>

                                {/* Net income */}
                                <div className="rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/10 to-transparent p-5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
                                        <Wallet
                                            size={20}
                                            className="text-violet-300"
                                        />
                                    </div>

                                    <p className="mt-5 text-xs text-slate-400">
                                        Net Income
                                    </p>

                                    <h3 className="mt-1 break-words text-xl font-bold text-white">
                                        {formatCurrency(
                                            financialData.totals.netIncome
                                        )}
                                    </h3>

                                    <p className="mt-2 text-xs text-slate-500">
                                        Income minus expenses
                                    </p>
                                </div>

                                {/* Savings */}
                                <div className="rounded-2xl border border-amber-400/15 bg-gradient-to-br from-amber-500/10 to-transparent p-5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
                                        <PiggyBank
                                            size={20}
                                            className="text-amber-300"
                                        />
                                    </div>

                                    <p className="mt-5 text-xs text-slate-400">
                                        Savings Contributions
                                    </p>

                                    <h3 className="mt-1 break-words text-xl font-bold text-white">
                                        {formatCurrency(
                                            financialData.totals.totalSavingsContributions
                                        )}
                                    </h3>

                                    <p className="mt-2 text-xs text-slate-500">
                                        {financialData.totals.contributionCount} contributions
                                    </p>
                                </div>
                            </div>

                            
                            {/* Monthly Income vs Expenses - Vertical Chart */}
                            <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-5 sm:p-6">

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="font-semibold text-white">
                                            Monthly Income vs Expenses
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            January – December {selectedYear}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-xs">
                                        <span className="flex items-center gap-2 text-slate-400">
                                            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
                                            Income
                                        </span>

                                        <span className="flex items-center gap-2 text-slate-400">
                                            <span className="h-2.5 w-2.5 rounded-sm bg-rose-400" />
                                            Expenses
                                        </span>
                                    </div>
                                </div>

                                {(() => {
                                    const chartMax = Math.max(maxChartValue, 1);

                                    const ticks = [1, 0.75, 0.5, 0.25, 0];

                                    const formatAxisValue = (value: number) => {
                                        if (value >= 1000000) {
                                            return `${(value / 1000000).toFixed(1)}M`;
                                        }

                                        if (value >= 1000) {
                                            return `${Math.round(value / 1000)}K`;
                                        }

                                        return Math.round(value).toString();
                                    };

                                    return (
                                        <div className="mt-8">

                                            {/* Chart area */}
                                            <div className="flex h-64 gap-2 sm:gap-4">

                                                {/* Y axis labels */}
                                                <div className="flex w-12 shrink-0 flex-col justify-between pb-1 text-right text-[10px] text-slate-500 sm:w-16 sm:text-xs">
                                                    {ticks.map((tick) => (
                                                        <span key={tick}>
                                                            {formatAxisValue(chartMax * tick)}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Vertical bars */}
                                                <div className="relative flex min-w-0 flex-1 items-stretch">

                                                    {/* Horizontal grid lines */}
                                                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                                                        {ticks.map((tick) => (
                                                            <div
                                                                key={tick}
                                                                className="w-full border-t border-white/[0.08]"
                                                            />
                                                        ))}
                                                    </div>

                                                    {/* Monthly columns */}
                                                    <div className="relative z-10 flex h-full w-full items-end justify-between gap-1 sm:gap-2">
                                                        {financialData.monthlyBreakdown.map((month) => (
                                                            <div
                                                                key={`${month.year}-${month.month}`}
                                                                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                                                            >
                                                                {/* Bars */}
                                                                <div className="flex h-full w-full items-end justify-center gap-[2px] sm:gap-1">

                                                                    {/* Income bar */}
                                                                    <div
                                                                        title={`${month.monthName} Income: ${formatCurrency(month.income)}`}
                                                                        className="w-[42%] max-w-5 rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-300 transition-all duration-500"
                                                                        style={{
                                                                            height: `${(month.income / chartMax) * 100}%`,
                                                                            minHeight: month.income > 0 ? "3px" : "0px"
                                                                        }}
                                                                    />

                                                                    {/* Expense bar */}
                                                                    <div
                                                                        title={`${month.monthName} Expenses: ${formatCurrency(month.expenses)}`}
                                                                        className="w-[42%] max-w-5 rounded-t-sm bg-gradient-to-t from-rose-600 to-rose-300 transition-all duration-500"
                                                                        style={{
                                                                            height: `${(month.expenses / chartMax) * 100}%`,
                                                                            minHeight: month.expenses > 0 ? "3px" : "0px"
                                                                        }}
                                                                    />
                                                                </div>

                                                                {/* Month label */}
                                                                <span className="mt-2 text-[9px] font-medium text-slate-400 sm:text-xs">
                                                                    {month.monthName.slice(0, 3)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="mt-4 text-center text-[10px] text-slate-500 sm:text-xs">
                                                Amounts in LKR
                                            </p>
                                        </div>
                                    );
                                })()}
                            </div>


                            {/* Spending insights */}
                            <div>
                                <div className="mb-4 flex items-center gap-2">
                                    <Sparkles
                                        size={18}
                                        className="text-violet-300"
                                    />

                                    <h3 className="font-semibold text-white">
                                        Spending Insights
                                    </h3>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">

                                    {/* Highest category */}
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15">
                                                <Award
                                                    size={21}
                                                    className="text-violet-300"
                                                />
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Highest Spending Category
                                                </p>

                                                <h4 className="mt-1 font-semibold text-white">
                                                    {financialData.highestSpendingCategory.categoryName}
                                                </h4>
                                            </div>
                                        </div>

                                        <p className="mt-5 text-xl font-bold text-white">
                                            {formatCurrency(
                                                financialData.highestSpendingCategory.amount
                                            )}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {financialData.highestSpendingCategory.transactionCount} expense transactions
                                        </p>
                                    </div>

                                    {/* Highest month */}
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15">
                                                <CalendarDays
                                                    size={21}
                                                    className="text-indigo-300"
                                                />
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Highest Spending Month
                                                </p>

                                                <h4 className="mt-1 font-semibold text-white">
                                                    {financialData.highestSpendingMonth.amount > 0
                                                        ? `${financialData.highestSpendingMonth.monthName} ${financialData.highestSpendingMonth.year}`
                                                        : "No expenses"}
                                                </h4>
                                            </div>
                                        </div>

                                        <p className="mt-5 text-xl font-bold text-white">
                                            {formatCurrency(
                                                financialData.highestSpendingMonth.amount
                                            )}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Highest monthly expense total
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Monthly breakdown table */}
                            <div>
                                <div className="mb-4">
                                    <h3 className="font-semibold text-white">
                                        Monthly Breakdown
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Detailed financial activity for all 12 months.
                                    </p>
                                </div>

                                <div className="overflow-x-auto rounded-2xl border border-white/10">
                                    <table className="w-full min-w-[650px] text-left text-sm">
                                        <thead className="bg-white/[0.045] text-xs uppercase tracking-wider text-slate-400">
                                            <tr>
                                                <th className="px-4 py-4">Month</th>
                                                <th className="px-4 py-4">Income</th>
                                                <th className="px-4 py-4">Expenses</th>
                                                <th className="px-4 py-4">Net</th>
                                                <th className="px-4 py-4">Savings</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-white/[0.06]">
                                            {financialData.monthlyBreakdown.map(
                                                (month) => (
                                                    <tr
                                                        key={`${month.year}-${month.month}`}
                                                        className="transition hover:bg-white/[0.025]"
                                                    >
                                                        <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-200">
                                                            {month.monthName} {month.year}
                                                        </td>

                                                        <td className="whitespace-nowrap px-4 py-4 text-emerald-300">
                                                            {formatCurrency(month.income)}
                                                        </td>

                                                        <td className="whitespace-nowrap px-4 py-4 text-rose-300">
                                                            {formatCurrency(month.expenses)}
                                                        </td>

                                                        <td className="whitespace-nowrap px-4 py-4 text-slate-200">
                                                            {formatCurrency(month.net)}
                                                        </td>

                                                        <td className="whitespace-nowrap px-4 py-4 text-amber-300">
                                                            {formatCurrency(month.savingsContributions)}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* PDF REPORT CARD - EXISTING FEATURE */}
            <section className={`${glassCard} relative w-full overflow-hidden`}>

                <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-400 to-blue-400" />

                <div className="border-b border-white/10 p-6 sm:p-8">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-violet-300/20 bg-gradient-to-br from-violet-500/20 to-indigo-500/10 shadow-lg shadow-violet-950/20">
                            <FileText
                                size={27}
                                className="text-violet-300"
                            />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold">
                                Generate PDF Report
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Choose a reporting period and download your
                                expense summary.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-7 p-6 sm:p-8 lg:p-9">

                    {/* Reporting period */}
                    <div>
                        <div className="mb-5 flex items-center gap-2">
                            <CalendarDays
                                size={18}
                                className="text-violet-300"
                            />

                            <h3 className="text-sm font-semibold text-slate-200">
                                Reporting Period
                            </h3>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="startDate"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Start Date
                                </label>

                                <input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setError("");
                                        setSuccess("");
                                    }}
                                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-sm text-white outline-none transition [color-scheme:dark] hover:border-white/20 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="endDate"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    End Date
                                </label>

                                <input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    min={startDate || undefined}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setError("");
                                        setSuccess("");
                                    }}
                                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-sm text-white outline-none transition [color-scheme:dark] hover:border-white/20 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Report contents */}
                    <div className="rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.10] to-indigo-500/[0.04] p-5 sm:p-6">
                        <div className="flex items-center gap-2">
                            <Sparkles
                                size={17}
                                className="text-violet-300"
                            />

                            <h3 className="text-sm font-semibold text-violet-200">
                                What your report contains
                            </h3>
                        </div>

                        <p className="mt-2 text-xs leading-5 text-slate-400">
                            Your PDF will include the following information
                            for the selected reporting period.
                        </p>

                        <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                            {[
                                "Selected reporting period",
                                "Total number of expenses",
                                "Total spending amount",
                                "Expense titles and dates",
                                "Expense categories",
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center gap-2.5 text-sm text-slate-300"
                                >
                                    <CheckCircle2
                                        size={16}
                                        className="shrink-0 text-emerald-400"
                                    />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PDF error */}
                    {error && (
                        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                            {error}
                        </div>
                    )}

                    {/* PDF success */}
                    {success && (
                        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                            {success}
                        </div>
                    )}

                    {/* PDF button */}
                    <button
                        type="button"
                        onClick={handleGenerateReport}
                        disabled={loading}
                        className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-6 py-4 font-semibold text-white shadow-lg shadow-violet-950/30 transition duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-violet-900/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                        {loading ? (
                            "Generating Report..."
                        ) : (
                            <>
                                <Download
                                    size={19}
                                    className="transition-transform group-hover:translate-y-0.5"
                                />
                                Generate & Download PDF
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-slate-500">
                        Your report contains only your own expense records.
                    </p>
                </div>
            </section>
        </div>
    );
}

export default ReportsPage;
