
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ReportsPage() {
    const navigate = useNavigate();

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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

            setSuccess("Your expense report has been generated and downloaded successfully.");
        } catch (err: any) {
            let message = "Unable to generate the report. Please try again.";

            // The backend may return a JSON error inside a Blob.
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
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                        <span className="text-lg">▦</span>
                        Dashboard
                    </button>

                    <button
                        onClick={() => navigate("/expenses")}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                        <span className="text-lg">↗</span>
                        Expenses
                    </button>

                    <button
                        onClick={() => navigate("/categories")}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                        <span className="text-lg">◈</span>
                        Categories
                    </button>

                    <button
                        className="flex w-full items-center gap-3 rounded-xl bg-indigo-500/15 px-4 py-3 text-left text-sm font-medium text-indigo-300"
                    >
                        <span className="text-lg">▤</span>
                        Reports
                    </button>
                </nav>

                <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold">Spending insights</p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                        Generate reports to review your expenses over a selected period.
                    </p>
                </div>
            </aside>

            {/* Main content */}
            <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">

                {/* Header */}
                <header className="mb-10">
                    <p className="text-sm text-slate-400">
                        Financial Overview
                    </p>

                    <h2 className="mt-1 text-3xl font-bold tracking-tight">
                        Expense Reports
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        Generate and download PDF reports of your spending.
                    </p>
                </header>

                {/* Report card */}
                <section className="max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#111a30]">

                    <div className="border-b border-white/10 p-6 sm:p-8">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-3xl text-indigo-300">
                                ▤
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold">
                                    Generate PDF Report
                                </h3>

                                <p className="mt-1 text-sm text-slate-400">
                                    Choose the period you want to review.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 p-6 sm:p-8">

                        {/* Date selection */}
                        <div className="grid gap-5 sm:grid-cols-2">

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
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-white outline-none transition focus:border-indigo-400"
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
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-white outline-none transition focus:border-indigo-400"
                                />
                            </div>
                        </div>

                        {/* Information */}
                        <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4">
                            <p className="text-sm font-medium text-indigo-200">
                                What will your report contain?
                            </p>

                            <ul className="mt-3 space-y-2 text-sm text-slate-400">
                                <li>✓ Selected reporting period</li>
                                <li>✓ Total number of expenses</li>
                                <li>✓ Total spending amount</li>
                                <li>✓ Expense titles, dates and categories</li>
                            </ul>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
                                {error}
                            </div>
                        )}

                        {/* Success message */}
                        {success && (
                            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                                {success}
                            </div>
                        )}

                        {/* Generate button */}
                        <button
                            type="button"
                            onClick={handleGenerateReport}
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                "Generating Report..."
                            ) : (
                                <>
                                    <span className="text-xl">↓</span>
                                    Generate & Download PDF
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-slate-500">
                            Your report contains only your own expense records.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default ReportsPage;
