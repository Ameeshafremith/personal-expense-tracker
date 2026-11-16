import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    loginUser,
    clearAuthError
} from "../features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../app/hooks";

import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    Wallet,
    ArrowRight
} from "lucide-react";

function LoginPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { loading, error } = useAppSelector(
        (state) => state.auth
    );

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            await dispatch(
                loginUser({ email, password })
            ).unwrap();

            navigate("/dashboard");
        } catch {
        }
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        dispatch(clearAuthError());
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        dispatch(clearAuthError());
    };

    // Motion only: moves the cursor spotlight inside the glass card
    const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };

    const inputStyle =
        "h-[40px] w-full bg-transparent pl-7 pr-8 text-[13px] font-medium tracking-wide text-white outline-none placeholder:text-[12px] placeholder:font-normal placeholder:text-slate-400/60";

    return (
        <main className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#05060D] text-white">

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

                .login-card {
                    animation: cardEntrance 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
                }

                .login-panel {
                    animation: panelEntranceLeft 0.9s ease-out 0.15s both;
                }

                .welcome-panel {
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

                .field-in-1 { animation-delay: 0.45s; }
                .field-in-2 { animation-delay: 0.55s; }
                .field-in-3 { animation-delay: 0.65s; }
                .field-in-4 { animation-delay: 0.75s; }
                .field-in-5 { animation-delay: 0.85s; }

                .card-spotlight {
                    opacity: 0;
                    transition: opacity 0.4s ease;
                    background: radial-gradient(
                        320px circle at var(--mx, 50%) var(--my, 50%),
                        rgba(167, 139, 250, 0.13),
                        transparent 65%
                    );
                }

                .login-card:hover .card-spotlight {
                    opacity: 1;
                }

                /* Keep browser autofill transparent so the glass look stays */
                .login-card input:-webkit-autofill,
                .login-card input:-webkit-autofill:hover,
                .login-card input:-webkit-autofill:focus {
                    -webkit-text-fill-color: #ffffff;
                    box-shadow: 0 0 0 1000px transparent inset;
                    transition: background-color 9999s ease-in-out 0s;
                    caret-color: #ffffff;
                }

                @media (prefers-reduced-motion: reduce) {
                    .login-card,
                    .login-panel,
                    .welcome-panel,
                    .ambient-float,
                    .bg-drift,
                    .glass-sheen,
                    .crack-pulse,
                    .error-shake,
                    .field-in {
                        animation: none;
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
                className="login-card relative z-10 grid h-[min(520px,88vh)] w-[min(900px,94vw)] grid-cols-2 overflow-hidden rounded-[22px] border border-white/[0.18] bg-[#12101c]/40 shadow-[0_30px_80px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.22)] backdrop-blur-[30px] backdrop-saturate-150"
            >

                {/* Glass reflections */}
                <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-gradient-to-br from-white/[0.10] via-transparent to-white/[0.02]" />

                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

                {/* Moving sheen */}
                <div className="pointer-events-none absolute inset-y-0 left-0 z-0 w-1/4 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent glass-sheen" />

                {/* Cursor spotlight */}
                <div className="card-spotlight pointer-events-none absolute inset-0 z-0" />

                {/* Slanted glass crack + right panel shading */}
                <svg
                    className="pointer-events-none absolute inset-0 z-0 h-full w-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id="panelShade" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
                        </linearGradient>
                        <linearGradient id="crackLine" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                            <stop offset="50%" stopColor="rgba(255,255,255,0.45)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>
                    </defs>

                    <polygon
                        points="46,0 100,0 100,100 53,100"
                        fill="url(#panelShade)"
                    />

                    <line
                        className="crack-pulse"
                        x1="46"
                        y1="0"
                        x2="53"
                        y2="100"
                        stroke="url(#crackLine)"
                        strokeWidth="1.2"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>

                {/* LEFT PANEL - LOGIN */}
                <section className="login-panel relative z-10 flex flex-col justify-center px-[clamp(20px,5vw,56px)] py-6">

                    {/* Logo */}
                    <div className="field-in field-in-1 mb-5 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-300/30 bg-gradient-to-br from-violet-500/30 to-blue-500/20 shadow-[0_0_18px_rgba(139,92,246,0.25)]">
                            <Wallet size={15} className="text-violet-200" />
                        </div>

                        <h1 className="text-[14px] font-bold tracking-tight">
                            Expense<span className="text-violet-400">Flow</span>
                        </h1>
                    </div>

                    {/* Heading */}
                    <div className="field-in field-in-1 mb-5">
                        <h2 className="text-[24px] font-bold tracking-tight">
                            Login
                        </h2>

                        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                            Welcome back! Enter your credentials to continue.
                        </p>
                    </div>

                    {/* Login form */}
                    <form
                        onSubmit={handleSubmit}
                        className="w-full space-y-4"
                    >

                        {/* Email */}
                        <div className="field-in field-in-2">
                            <label
                                htmlFor="email"
                                className="sr-only"
                            >
                                Email address
                            </label>

                            <div className="group relative border-b border-white/20 transition-colors duration-300 hover:border-white/40">
                                <Mail
                                    size={15}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within:text-white"
                                />

                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => handleEmailChange(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className={inputStyle}
                                />

                                <span className="pointer-events-none absolute -bottom-px left-0 h-[2px] w-full origin-left scale-x-0 bg-white shadow-[0_0_10px_rgba(167,139,250,0.8)] transition-transform duration-500 ease-out group-focus-within:scale-x-100" />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="field-in field-in-3">
                            <label
                                htmlFor="password"
                                className="sr-only"
                            >
                                Password
                            </label>

                            <div className="group relative border-b border-white/20 transition-colors duration-300 hover:border-white/40">
                                <Lock
                                    size={15}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within:text-white"
                                />

                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className={inputStyle}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 transition-all duration-300 hover:scale-110 hover:text-white"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff size={15} />
                                    ) : (
                                        <Eye size={15} />
                                    )}
                                </button>

                                <span className="pointer-events-none absolute -bottom-px left-0 h-[2px] w-full origin-left scale-x-0 bg-white shadow-[0_0_10px_rgba(167,139,250,0.8)] transition-transform duration-500 ease-out group-focus-within:scale-x-100" />
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <p
                                role="alert"
                                className="error-shake rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-2.5 text-[12px] text-red-300"
                            >
                                {error}
                            </p>
                        )}

                        {/* Login button */}
                        <div className="field-in field-in-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex h-[42px] w-full items-center justify-center overflow-hidden rounded-full border border-white/[0.18] bg-gradient-to-b from-white/[0.12] to-white/[0.04] text-[13px] font-semibold text-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_24px_rgba(0,0,0,0.30)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/40 hover:from-violet-400/20 hover:to-indigo-500/10 hover:text-white hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_10px_30px_rgba(99,70,220,0.30)] active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-[350%]" />

                                <span className="relative">
                                    {loading ? "Signing in..." : "Login"}
                                </span>
                            </button>
                        </div>
                    </form>

                    {/* Register + forgot links */}
                    <div className="field-in field-in-5 mt-5 flex flex-col items-center gap-1.5">
                        <p className="text-[11px] text-slate-400">
                            Don't have an account?{" "}
                            <Link
                                to="/register"
                                className="font-semibold text-white underline underline-offset-2 transition-colors hover:text-violet-300"
                            >
                                Sign Up
                            </Link>
                        </p>

                        <Link
                            to="/forgot-password"
                            className="text-[10px] text-slate-500 transition-colors hover:text-violet-300"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                </section>

                {/* RIGHT PANEL - WELCOME */}
                <section className="welcome-panel relative z-10 flex flex-col items-start justify-center py-6 pl-[clamp(28px,7vw,88px)] pr-[clamp(20px,4vw,48px)]">

                    <h2 className="field-in field-in-2 max-w-[300px] text-[clamp(26px,3.6vw,34px)] font-extrabold leading-[1.12] tracking-tight">
                        HELLO,
                        <br />
                        FRIEND!
                    </h2>

                    <p className="field-in field-in-3 mt-4 max-w-[240px] text-[12px] leading-[1.7] text-slate-300/80">
                        Enter your personal details and start your journey with us.
                    </p>

                    <Link
                        to="/register"
                        className="field-in field-in-4 group relative mt-6 inline-flex h-[38px] items-center gap-2.5 overflow-hidden rounded-full border border-white/[0.22] bg-gradient-to-b from-white/[0.10] to-white/[0.03] px-5 text-[12px] font-semibold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/50 hover:from-violet-400/20 hover:to-indigo-500/10 hover:shadow-[0_8px_25px_rgba(139,92,246,0.22)]"
                    >
                        <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[400%]" />

                        <span className="relative">Create Account</span>

                        <ArrowRight
                            size={14}
                            className="relative transition-transform duration-300 group-hover:translate-x-1"
                        />
                    </Link>
                </section>
            </div>
        </main>
    );
}

export default LoginPage;