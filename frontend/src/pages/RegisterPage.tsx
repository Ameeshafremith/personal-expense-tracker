import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../app/hooks";

import {
    User,
    Mail,
    Lock,
    ShieldCheck,
    Wallet,
    ArrowRight
} from "lucide-react";

function RegisterPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { loading, error } = useAppSelector((state) => state.auth);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [formError, setFormError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError("");

        if (password.length < 8) {
            setFormError("Password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setFormError("Passwords do not match.");
            return;
        }

        try {
            await dispatch(registerUser({ name, email, password })).unwrap();
            navigate("/login", {
                state: { message: "Account created successfully. Please sign in." }
            });
        } catch {
            // The error is displayed from Redux state.
        }
    };

    // Motion only: moves the cursor spotlight inside the glass card
    const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };

    const inputStyle =
        "h-[38px] w-full bg-transparent pl-7 pr-2 text-[13px] font-medium tracking-wide text-white outline-none placeholder:text-[12px] placeholder:font-normal placeholder:text-slate-400/60";

    const fieldWrapStyle =
        "group relative border-b border-white/20 transition-colors duration-300 hover:border-white/40";

    const iconStyle =
        "absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within:text-white";

    const underlineStyle =
        "pointer-events-none absolute -bottom-px left-0 h-[2px] w-full origin-left scale-x-0 bg-white shadow-[0_0_10px_rgba(167,139,250,0.8)] transition-transform duration-500 ease-out group-focus-within:scale-x-100";

    return (
        <main className="auth-page fixed inset-0 flex items-center justify-center overflow-hidden bg-[#05060D] text-white">

            <style>{`
                @keyframes cardEntrance {
                    from {
                        opacity: 0;
                        transform: translateY(25px) scale(0.97);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes panelEntranceLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-25px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes panelEntranceRight {
                    from {
                        opacity: 0;
                        transform: translateX(25px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes ambientFloat {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-15px);
                    }
                }

                @keyframes fieldIn {
                    from {
                        opacity: 0;
                        transform: translateY(14px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes bgDrift {
                    0% {
                        transform: scale(1.06) translate3d(0, 0, 0);
                    }
                    100% {
                        transform: scale(1.14) translate3d(-1.5%, -1%, 0);
                    }
                }

                @keyframes glassSheen {
                    0% {
                        transform: translateX(-140%) skewX(-20deg);
                    }
                    35%, 100% {
                        transform: translateX(380%) skewX(-20deg);
                    }
                }

                @keyframes crackPulse {
                    0%, 100% {
                        opacity: 0.55;
                    }
                    50% {
                        opacity: 1;
                    }
                }

                @keyframes errorShake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-6px); }
                    40% { transform: translateX(5px); }
                    60% { transform: translateX(-3px); }
                    80% { transform: translateX(2px); }
                }

                .register-card {
                    animation: cardEntrance 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
                }

                .welcome-panel {
                    animation: panelEntranceLeft 0.9s ease-out 0.15s both;
                }

                .register-panel {
                    animation: panelEntranceRight 0.9s ease-out 0.25s both;
                }

                .ambient-float {
                    animation: ambientFloat 9s ease-in-out infinite;
                }

                .bg-drift {
                    animation: bgDrift 28s ease-in-out infinite alternate;
                }

                .glass-sheen {
                    animation: glassSheen 10s ease-in-out 1.2s infinite;
                }

                .crack-pulse {
                    animation: crackPulse 5s ease-in-out infinite;
                }

                .error-shake {
                    animation: errorShake 0.45s ease-in-out both;
                }

                .field-in {
                    animation: fieldIn 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
                }

                .field-in-1 { animation-delay: 0.40s; }
                .field-in-2 { animation-delay: 0.50s; }
                .field-in-3 { animation-delay: 0.60s; }
                .field-in-4 { animation-delay: 0.70s; }
                .field-in-5 { animation-delay: 0.80s; }
                .field-in-6 { animation-delay: 0.90s; }
                .field-in-7 { animation-delay: 1.00s; }

                .card-spotlight {
                    opacity: 0;
                    transition: opacity 0.4s ease;
                    background: radial-gradient(
                        320px circle at var(--mx, 50%) var(--my, 50%),
                        rgba(167, 139, 250, 0.13),
                        transparent 65%
                    );
                }

                .register-card:hover .card-spotlight {
                    opacity: 1;
                }

                /* Keep browser autofill transparent so the glass look stays */
                .register-card input:-webkit-autofill,
                .register-card input:-webkit-autofill:hover,
                .register-card input:-webkit-autofill:focus {
                    -webkit-text-fill-color: #ffffff;
                    box-shadow: 0 0 0 1000px transparent inset;
                    transition: background-color 9999s ease-in-out 0s;
                    caret-color: #ffffff;
                }

                @media (prefers-reduced-motion: reduce) {
                    .register-card,
                    .welcome-panel,
                    .register-panel,
                    .ambient-float,
                    .bg-drift,
                    .glass-sheen,
                    .crack-pulse,
                    .error-shake,
                    .field-in {
                        animation: none;
                    }
                }

                /* Responsive layout - tablet and mobile only */
                @media (max-width: 1023px) {
                    .auth-page {
                        position: relative;
                        min-height: 100svh;
                        height: auto;
                        overflow-x: hidden;
                        overflow-y: auto;
                        padding: 24px 16px;
                        box-sizing: border-box;
                    }

                    .register-card {
                        width: min(520px, 100%);
                        height: auto;
                        min-height: 0;
                        grid-template-columns: 1fr;
                        overflow: visible;
                        border-radius: 20px;
                    }

                    .welcome-panel {
                        display: none;
                    }

                    .register-panel {
                        padding: 32px clamp(22px, 6vw, 40px);
                    }
                }

                @media (max-width: 480px) {
                    .auth-page {
                        padding: 18px 12px;
                    }

                    .register-card {
                        width: 100%;
                        border-radius: 16px;
                    }

                    .register-panel {
                        padding: 28px 22px;
                    }

                    .register-panel input {
                        font-size: 14px;
                    }
                }

                @media (max-height: 720px) and (max-width: 1023px) {
                    .auth-page {
                        align-items: flex-start;
                    }
                }
            `}</style>

            {/* Background image and overlays */}
            <div
                className="bg-drift pointer-events-none absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `
                        linear-gradient(
                            rgba(5, 6, 13, 0.30),
                            rgba(5, 6, 13, 0.50)
                        ),
                        url('/expenseflow-bg.svg')
                    `
                }}
            />

            {/* Ambient lighting */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="ambient-float absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-700/20 blur-[140px]" />

                <div className="ambient-float absolute -bottom-40 -right-40 h-[550px] w-[550px] rounded-full bg-blue-600/20 blur-[150px]" />

                <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.08] blur-[140px]" />
            </div>

            {/* Main glass card */}
            <div
                onMouseMove={handleCardMouseMove}
                className="register-card relative z-10 grid h-[min(580px,92vh)] w-[min(900px,94vw)] grid-cols-2 overflow-hidden rounded-[22px] border border-white/[0.18] bg-[#12101c]/40 shadow-[0_30px_80px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.22)] backdrop-blur-[30px] backdrop-saturate-150"
            >

                {/* Glass reflections */}
                <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-gradient-to-br from-white/[0.10] via-transparent to-white/[0.02]" />

                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

                {/* Moving sheen */}
                <div className="glass-sheen pointer-events-none absolute inset-y-0 left-0 z-0 w-1/4 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

                {/* Cursor spotlight */}
                <div className="card-spotlight pointer-events-none absolute inset-0 z-0" />

                {/* Slanted glass crack + welcome panel shading */}
                <svg
                    className="pointer-events-none absolute inset-0 z-0 h-full w-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id="registerPanelShade" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
                        </linearGradient>
                        <linearGradient id="registerCrackLine" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                            <stop offset="50%" stopColor="rgba(255,255,255,0.45)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>
                    </defs>

                    <polygon
                        points="0,0 46,0 53,100 0,100"
                        fill="url(#registerPanelShade)"
                    />

                    <line
                        className="crack-pulse"
                        x1="46"
                        y1="0"
                        x2="53"
                        y2="100"
                        stroke="url(#registerCrackLine)"
                        strokeWidth="1.2"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>

                {/* LEFT PANEL - WELCOME BACK */}
                <section className="welcome-panel relative z-10 flex flex-col items-start justify-center py-6 pl-[clamp(20px,5vw,56px)] pr-[clamp(20px,6vw,72px)]">

                    {/* Logo */}
                    <div className="field-in field-in-1 mb-6 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-300/30 bg-gradient-to-br from-violet-500/30 to-blue-500/20 shadow-[0_0_18px_rgba(139,92,246,0.25)]">
                            <Wallet size={15} className="text-violet-200" />
                        </div>

                        <span className="text-[14px] font-bold tracking-tight">
                            Expense<span className="text-violet-400">Flow</span>
                        </span>
                    </div>

                    <h2 className="field-in field-in-2 max-w-[300px] text-[clamp(26px,3.6vw,34px)] font-extrabold leading-[1.12] tracking-tight">
                        WELCOME
                        <br />
                        BACK!
                    </h2>

                    <p className="field-in field-in-3 mt-4 max-w-[240px] text-[12px] leading-[1.7] text-slate-300/80">
                        Already a Member? Please Login with your credentials.
                    </p>

                    <Link
                        to="/login"
                        className="field-in field-in-4 group relative mt-6 inline-flex h-[38px] items-center gap-2.5 overflow-hidden rounded-full border border-white/[0.22] bg-gradient-to-b from-white/[0.10] to-white/[0.03] px-5 text-[12px] font-semibold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/50 hover:from-violet-400/20 hover:to-indigo-500/10 hover:shadow-[0_8px_25px_rgba(139,92,246,0.22)]"
                    >
                        <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[400%]" />

                        <span className="relative">Sign In</span>

                        <ArrowRight
                            size={14}
                            className="relative transition-transform duration-300 group-hover:translate-x-1"
                        />
                    </Link>
                </section>

                {/* RIGHT PANEL - CREATE ACCOUNT */}
                <section className="register-panel relative z-10 flex flex-col justify-center py-6 pl-[clamp(24px,6vw,72px)] pr-[clamp(20px,5vw,56px)]">

                    <div className="field-in field-in-1 mb-4">
                        <p className="text-[10px] font-semibold tracking-[0.2em] text-violet-400">
                            PERSONAL EXPENSE TRACKER
                        </p>

                        <h1 className="mt-1.5 text-[24px] font-bold tracking-tight">
                            Create Account
                        </h1>

                        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                            Start organizing and tracking your expenses.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full space-y-3">

                        {/* Full name */}
                        <div className="field-in field-in-2">
                            <label htmlFor="name" className="sr-only">
                                Full name
                            </label>

                            <div className={fieldWrapStyle}>
                                <User size={15} className={iconStyle} />

                                <input
                                    id="name"
                                    type="text"
                                    required
                                    maxLength={80}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className={inputStyle}
                                />

                                <span className={underlineStyle} />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="field-in field-in-3">
                            <label htmlFor="register-email" className="sr-only">
                                Email address
                            </label>

                            <div className={fieldWrapStyle}>
                                <Mail size={15} className={iconStyle} />

                                <input
                                    id="register-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className={inputStyle}
                                />

                                <span className={underlineStyle} />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="field-in field-in-4">
                            <label htmlFor="register-password" className="sr-only">
                                Password
                            </label>

                            <div className={fieldWrapStyle}>
                                <Lock size={15} className={iconStyle} />

                                <input
                                    id="register-password"
                                    type="password"
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 8 characters"
                                    className={inputStyle}
                                />

                                <span className={underlineStyle} />
                            </div>
                        </div>

                        {/* Confirm password */}
                        <div className="field-in field-in-5">
                            <label htmlFor="confirm-password" className="sr-only">
                                Confirm password
                            </label>

                            <div className={fieldWrapStyle}>
                                <ShieldCheck size={15} className={iconStyle} />

                                <input
                                    id="confirm-password"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter your password"
                                    className={inputStyle}
                                />

                                <span className={underlineStyle} />
                            </div>
                        </div>

                        {/* Error */}
                        {(formError || error) && (
                            <p
                                role="alert"
                                className="error-shake rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-2 text-[12px] text-red-300"
                            >
                                {formError || error}
                            </p>
                        )}

                        {/* Create account button */}
                        <div className="field-in field-in-6 pt-1">
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex h-[42px] w-full items-center justify-center overflow-hidden rounded-full border border-white/[0.18] bg-gradient-to-b from-white/[0.12] to-white/[0.04] text-[13px] font-semibold text-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_24px_rgba(0,0,0,0.30)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/40 hover:from-violet-400/20 hover:to-indigo-500/10 hover:text-white hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_10px_30px_rgba(99,70,220,0.30)] active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-[350%]" />

                                <span className="relative">
                                    {loading ? "Creating account..." : "Create Account"}
                                </span>
                            </button>
                        </div>
                    </form>

                    <p className="field-in field-in-7 mt-4 text-center text-[11px] text-slate-400">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-semibold text-white underline underline-offset-2 transition-colors hover:text-violet-300"
                        >
                            Sign in
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}

export default RegisterPage;