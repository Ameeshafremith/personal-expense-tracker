
import { useState } from "react";
import {
    FileText,
    Download,
    CalendarDays,
    Sparkles,
    CheckCircle2,
} from "lucide-react";
import api from "../services/api";

function ReportsPage() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const glassCard =
        "rounded-3xl border border-white/10 bg-white/[0.055] shadow-[0_8px_32px_rgba(0,0,0,0.20)] backdrop-blur-2xl";

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

    return (
        <div className="relative space-y-8">

            {/* Subtle background lighting */}
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
                    Generate detailed financial reports and review your spending
                    activity over any selected period.
                </p>
            </section>

            {/* PDF Report card */}
            <section className={`${glassCard} relative w-full overflow-hidden`}>

                {/* Top accent */}
                <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-400 to-blue-400" />

                {/* Card heading */}
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

                    {/* Error message */}
                    {error && (
                        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                            {error}
                        </div>
                    )}

                    {/* Success message */}
                    {success && (
                        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                            {success}
                        </div>
                    )}

                    {/* Generate button */}
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
