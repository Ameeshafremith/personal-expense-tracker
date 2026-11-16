
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Wallet, ArrowRight, CheckCircle } from "lucide-react";
import api from "../services/api";

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            await api.post("/auth/forgot-password", {
                email: email.trim()
            });

            setSuccess(true);
        } catch (err) {
            const message =
                (err as {
                    response?: { data?: { message?: string } };
                }).response?.data?.message;

            setError(message || "Unable to process your request. Please try again.");
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

                .forgot-card {
                    animation: cardEntrance 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
                }

                .forgot-ambient {
                    animation: ambientFloat 9s ease-in-out infinite;
                }

                .forgot-sheen {
                    animation: glassSheen 10s ease-in-out 1.2s infinite;
                }

                .forgot-spotlight {
                    opacity: 0;
                    transition: opacity 0.4s ease;
                    background: radial-gradient(
                        320px circle at var(--mx, 50%) var(--my, 50%),
                        rgba(167, 139, 250, 0.13),
                        transparent 65%
                    );
                }

                .forgot-card:hover .forgot-spotlight {
                    opacity: 1;
                }

                @media (prefers-reduced-motion: reduce) {
                    .forgot-card, .forgot-ambient, .forgot-sheen {
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
                <div className="forgot-ambient absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-700/20 blur-[140px]" />

                <div className="forgot-ambient absolute -bottom-40 -right-40 h-[550px] w-[550px] rounded-full bg-blue-600/20 blur-[150px]" />

                <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.08] blur-[140px]" />
            </div>

            {/* Glass card */}
            <div
                onMouseMove={handleCardMouseMove}
                className="forgot-card relative z-10 w-full max-w-[440px] overflow-hidden rounded-[22px] border border-white/[0.18] bg-[#12101c]/50 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.22)] backdrop-blur-[30px] backdrop-saturate-150 sm:p-10"
            >
                <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-gradient-to-br from-white/[0.10] via-transparent to-white/[0.02]" />

                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

                <div className="pointer-events-none absolute inset-y-0 left-0 z-0 w-1/4 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent forgot-sheen" />

                <div className="forgot-spotlight pointer-events-none absolute inset-0 z-0" />

                <div className="relative z-10">

                    {/* Logo */}
                    <div className="mb-8 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-300/30 bg-gradient-to-br from-violet-500/30 to-blue-500/20 shadow-[0_0_18px_rgba(139,92,246,0.25)]">
                            <Wallet size={16} className="text-violet-200" />
                        </div>

                        <h1 className="text-[15px] font-bold tracking-tight">
                            Expense<span className="text-violet-400">Flow</span>
                        </h1>
                    </div>

                    {!success ? (
                        <>
                            <div className="mb-8">
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-500/10">
                                    <Mail size={22} className="text-violet-300" />
                                </div>

                                <h2 className="text-[26px] font-bold tracking-tight">
                                    Forgot Password?
                                </h2>

                                <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
                                    Don't worry! Enter your registered email
                                    address and we'll send you a link to reset
                                    your password.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-[11px] font-medium text-slate-300"
                                    >
                                        Email address
                                    </label>

                                    <div className="group relative border-b border-white/20 transition-colors duration-300 hover:border-white/40">
                                        <Mail
                                            size={15}
                                            className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white"
                                        />

                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setError("");
                                            }}
                                            placeholder="Enter your registered email"
                                            required
                                            className="h-[42px] w-full bg-transparent pl-7 pr-2 text-[13px] font-medium tracking-wide text-white outline-none placeholder:text-[11px] placeholder:font-normal placeholder:text-slate-400/60"
                                        />

                                        <span className="pointer-events-none absolute -bottom-px left-0 h-[2px] w-full origin-left scale-x-0 bg-white shadow-[0_0_10px_rgba(167,139,250,0.8)] transition-transform duration-500 group-focus-within:scale-x-100" />
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
                                    disabled={loading}
                                    className="group relative flex h-[43px] w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-white/[0.18] bg-gradient-to-b from-white/[0.12] to-white/[0.04] text-[13px] font-semibold text-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_24px_rgba(0,0,0,0.30)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/40 hover:from-violet-400/20 hover:to-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-[350%]" />

                                    <span className="relative">
                                        {loading ? "Sending reset link..." : "Send Reset Link"}
                                    </span>

                                    {!loading && (
                                        <ArrowRight size={15} className="relative" />
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="py-5 text-center">
                            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-500/10">
                                <CheckCircle size={27} className="text-emerald-300" />
                            </div>

                            <h2 className="text-[24px] font-bold">
                                Check Your Email
                            </h2>

                            <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
                                If an account exists with{" "}
                                <span className="font-semibold text-violet-300">
                                    {email}
                                </span>
                                , you'll receive a password reset link shortly.
                                Please also check your spam folder.
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    setSuccess(false);
                                    setEmail("");
                                }}
                                className="mt-6 text-[11px] font-semibold text-violet-300 transition hover:text-white"
                            >
                                Try another email
                            </button>
                        </div>
                    )}

                    {/* Back to login */}
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

export default ForgotPasswordPage;
