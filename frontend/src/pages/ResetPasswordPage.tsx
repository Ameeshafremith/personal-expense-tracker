
import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    Eye,
    EyeOff,
    Lock,
    Wallet,
    CheckCircle
} from "lucide-react";
import api from "../services/api";

function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (!token) {
            setError("The password reset link is invalid or incomplete.");
            return;
        }

        if (password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await api.post("/auth/reset-password", {
                token,
                password
            });

            setSuccess(true);
        } catch (err) {
            const message =
                (err as {
                    response?: { data?: { message?: string } };
                }).response?.data?.message;

            setError(message || "Unable to reset your password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCardMouseMove = (
        e: React.MouseEvent<HTMLDivElement>
    ) => {
        const rect = e.currentTarget.getBoundingClientRect();

        e.currentTarget.style.setProperty(
            "--mx",
            `${e.clientX - rect.left}px`
        );

        e.currentTarget.style.setProperty(
            "--my",
            `${e.clientY - rect.top}px`
        );
    };

    const inputStyle =
        "h-[42px] w-full bg-transparent pl-7 pr-9 text-[13px] font-medium tracking-wide text-white outline-none placeholder:text-[11px] placeholder:font-normal placeholder:text-slate-400/60";

    return (
        <main className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-[#05060D] px-4 py-8 text-white">

            <style>{`
                @keyframes cardEntrance {
                    from { opacity: 0; transform: translateY(25px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                @keyframes ambientFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }

                @keyframes glassSheen {
                    0% { transform: translateX(-140%) skewX(-20deg); }
                    35%, 100% { transform: translateX(380%) skewX(-20deg); }
                }

                .reset-card {
                    animation: cardEntrance 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
                }

                .reset-ambient {
                    animation: ambientFloat 9s ease-in-out infinite;
                }

                .reset-sheen {
                    animation: glassSheen 10s ease-in-out 1.2s infinite;
                }

                .reset-spotlight {
                    opacity: 0;
                    transition: opacity 0.4s ease;
                    background: radial-gradient(
                        320px circle at var(--mx, 50%) var(--my, 50%),
                        rgba(167, 139, 250, 0.13),
                        transparent 65%
                    );
                }

                .reset-card:hover .reset-spotlight {
                    opacity: 1;
                }

                @media (prefers-reduced-motion: reduce) {
                    .reset-card, .reset-ambient, .reset-sheen {
                        animation: none;
                    }
                }
            `}</style>

            {/* Background */}
            <div
                className="pointer-events-none absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(5,6,13,.35), rgba(5,6,13,.55)),
                        url('/expenseflow-bg.svg')
                    `
                }}
            />

            {/* Ambient lighting */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="reset-ambient absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-700/20 blur-[140px]" />

                <div className="reset-ambient absolute -bottom-40 -right-40 h-[550px] w-[550px] rounded-full bg-blue-600/20 blur-[150px]" />

                <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.08] blur-[140px]" />
            </div>

            {/* Glass card */}
            <div
                onMouseMove={handleCardMouseMove}
                className="reset-card relative z-10 w-full max-w-[440px] overflow-hidden rounded-[22px] border border-white/[0.18] bg-[#12101c]/50 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.22)] backdrop-blur-[30px] backdrop-saturate-150 sm:p-10"
            >
                <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-gradient-to-br from-white/[0.10] via-transparent to-white/[0.02]" />

                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

                <div className="pointer-events-none absolute inset-y-0 left-0 z-0 w-1/4 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent reset-sheen" />

                <div className="reset-spotlight pointer-events-none absolute inset-0 z-0" />

                <div className="relative z-10">

                    {/* Logo */}
                    <div className="mb-8 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-300/30 bg-gradient-to-br from-violet-500/30 to-blue-500/20">
                            <Wallet size={16} className="text-violet-200" />
                        </div>

                        <h1 className="text-[15px] font-bold tracking-tight">
                            Expense<span className="text-violet-400">Flow</span>
                        </h1>
                    </div>

                    {success ? (
                        <div className="py-5 text-center">
                            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-500/10">
                                <CheckCircle size={27} className="text-emerald-300" />
                            </div>

                            <h2 className="text-[24px] font-bold">
                                Password Updated!
                            </h2>

                            <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
                                Your password has been changed successfully.
                                You can now sign in using your new password.
                            </p>

                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="mt-7 flex h-[43px] w-full items-center justify-center gap-2 rounded-full border border-white/[0.18] bg-gradient-to-r from-violet-500/30 to-indigo-500/30 text-[13px] font-semibold transition hover:border-violet-300/50"
                            >
                                Go to Login
                                <ArrowRight size={15} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-500/10">
                                    <Lock size={22} className="text-violet-300" />
                                </div>

                                <h2 className="text-[26px] font-bold tracking-tight">
                                    Create New Password
                                </h2>

                                <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
                                    Choose a new password for your ExpenseFlow account.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">

                                {/* New password */}
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="mb-2 block text-[11px] font-medium text-slate-300"
                                    >
                                        New password
                                    </label>

                                    <div className="group relative border-b border-white/20 transition-colors hover:border-white/40">
                                        <Lock
                                            size={15}
                                            className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white"
                                        />

                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            required
                                            minLength={8}
                                            autoComplete="new-password"
                                            className={inputStyle}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                        >
                                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm password */}
                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="mb-2 block text-[11px] font-medium text-slate-300"
                                    >
                                        Confirm new password
                                    </label>

                                    <div className="group relative border-b border-white/20 transition-colors hover:border-white/40">
                                        <Lock
                                            size={15}
                                            className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white"
                                        />

                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            required
                                            minLength={8}
                                            autoComplete="new-password"
                                            className={inputStyle}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                        >
                                            {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <p
                                        role="alert"
                                        className="rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-3 text-[12px] text-red-300"
                                    >
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !token}
                                    className="group relative flex h-[43px] w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-white/[0.18] bg-gradient-to-b from-white/[0.12] to-white/[0.04] text-[13px] font-semibold text-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_24px_rgba(0,0,0,0.30)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/40 hover:from-violet-400/20 hover:to-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? "Updating password..." : "Reset Password"}
                                    {!loading && <ArrowRight size={15} />}
                                </button>
                            </form>
                        </>
                    )}

                    <div className="mt-8 border-t border-white/10 pt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-400 transition hover:text-violet-300"
                        >
                            <ArrowLeft size={14} />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default ResetPasswordPage;
