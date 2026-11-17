import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

type TransitionDir = "forward" | "back";

// Must match the wipe animation durations in the <style> block below
const WIPE_COVER_MS = 520;
const WIPE_REVEAL_MS = 900;

function RegisterPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { loading, error } = useAppSelector((state) => state.auth);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [formError, setFormError] = useState("");

    // Glass transition state
    const [enterDir] = useState<TransitionDir | undefined>(
        () =>
            (location.state as { authTransition?: TransitionDir } | null)
                ?.authTransition
    );
    const [revealing, setRevealing] = useState(Boolean(enterDir));
    const [leaving, setLeaving] = useState<TransitionDir | null>(null);
    const timerRef = useRef<number | null>(null);

    // This page never scrolls
    useEffect(() => {
        const prevBody = document.body.style.overflow;
        const prevHtml = document.documentElement.style.overflow;
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = prevBody;
            document.documentElement.style.overflow = prevHtml;
        };
    }, []);

    // Remove the reveal overlay once its animation is done
    useEffect(() => {
        if (!revealing) return;
        const t = window.setTimeout(() => setRevealing(false), WIPE_REVEAL_MS);
        return () => window.clearTimeout(t);
    }, [revealing]);

    useEffect(() => {
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, []);

    const transitionTo = (
        path: string,
        dir: TransitionDir,
        extraState: Record<string, unknown> = {}
    ) => {
        if (leaving) return;

        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (reduced) {
            navigate(path, { state: extraState });
            return;
        }

        setLeaving(dir);
        timerRef.current = window.setTimeout(() => {
            navigate(path, { state: { ...extraState, authTransition: dir } });
        }, WIPE_COVER_MS);
    };

    const handleSwitchClick = (
        e: React.MouseEvent<HTMLAnchorElement>,
        path: string,
        dir: TransitionDir
    ) => {
        if (
            e.defaultPrevented ||
            e.button !== 0 ||
            e.metaKey ||
            e.ctrlKey ||
            e.shiftKey ||
            e.altKey
        ) {
            return;
        }
        e.preventDefault();
        transitionTo(path, dir);
    };

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
            transitionTo("/login", "back", {
                message: "Account created successfully. Please sign in."
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
        "auth-input w-full bg-transparent pl-7 pr-2 text-[13px] font-medium tracking-wide text-white outline-none placeholder:text-[12px] placeholder:font-normal placeholder:text-slate-400/60";

    const fieldWrapStyle =
        "group relative border-b border-white/20 transition-colors duration-300 hover:border-white/40";

    const iconStyle =
        "absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within:text-white";

    const underlineStyle =
        "pointer-events-none absolute -bottom-px left-0 h-[2px] w-full origin-left scale-x-0 bg-white shadow-[0_0_10px_rgba(167,139,250,0.8)] transition-transform duration-500 ease-out group-focus-within:scale-x-100";

    // Glass wipe direction: forward sweeps right -> left, back sweeps left -> right
    const wipeDir: TransitionDir = leaving ?? enterDir ?? "forward";
    const wipeVars = (
        wipeDir === "forward"
            ? { "--wipe-start": "110%", "--wipe-end": "-110%", "--wipe-skew": "-10deg" }
            : { "--wipe-start": "-110%", "--wipe-end": "110%", "--wipe-skew": "10deg" }
    ) as React.CSSProperties;

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

                @keyframes cardReveal {
                    from {
                        opacity: 0;
                        transform: scale(0.955);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes cardLeave {
                    from {
                        opacity: 1;
                        transform: scale(1);
                    }
                    to {
                        opacity: 0.4;
                        transform: scale(0.965);
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

                /* Glass pane that sweeps across the screen between pages */
                @keyframes wipeCover {
                    from {
                        transform: translateX(var(--wipe-start)) skewX(var(--wipe-skew));
                    }
                    to {
                        transform: translateX(0) skewX(var(--wipe-skew));
                    }
                }

                @keyframes wipeReveal {
                    from {
                        transform: translateX(0) skewX(var(--wipe-skew));
                    }
                    to {
                        transform: translateX(var(--wipe-end)) skewX(var(--wipe-skew));
                    }
                }

                /* ---------- Card + panel layout (desktop base) ---------- */
                .auth-page {
                    box-sizing: border-box;
                    overscroll-behavior: none;
                }

                .auth-card {
                    --field-h: 38px;
                    --gap: 12px;
                    --head-mb: 16px;
                    --foot-mt: 16px;
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                    width: min(900px, 94vw);
                    height: min(580px, 92vh);
                    height: min(580px, 92dvh);
                    animation: cardEntrance 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
                }

                .auth-card.card-from-wipe {
                    animation: cardReveal 0.85s cubic-bezier(0.2, 0.8, 0.2, 1) 0.12s both;
                }

                .auth-card.card-leaving {
                    animation: cardLeave 0.5s ease-in both;
                    pointer-events: none;
                }

                .welcome-panel {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    justify-content: center;
                    min-width: 0;
                    padding: 24px clamp(20px, 6vw, 72px) 24px clamp(20px, 5vw, 56px);
                    animation: panelEntranceLeft 0.9s ease-out 0.15s both;
                }

                .form-panel {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    min-width: 0;
                    padding: 24px clamp(20px, 5vw, 56px) 24px clamp(24px, 6vw, 72px);
                    animation: panelEntranceRight 0.9s ease-out 0.25s both;
                }

                .form-panel .mobile-logo {
                    display: none;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 16px;
                }

                .form-head {
                    margin-bottom: var(--head-mb);
                }

                .form-stack {
                    display: flex;
                    flex-direction: column;
                    gap: var(--gap);
                }

                .form-foot {
                    margin-top: var(--foot-mt);
                }

                .auth-input {
                    height: var(--field-h);
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

                .auth-card:hover .card-spotlight {
                    opacity: 1;
                }

                /* Keep browser autofill transparent so the glass look stays */
                .auth-card input:-webkit-autofill,
                .auth-card input:-webkit-autofill:hover,
                .auth-card input:-webkit-autofill:focus {
                    -webkit-text-fill-color: #ffffff;
                    box-shadow: 0 0 0 1000px transparent inset;
                    transition: background-color 9999s ease-in-out 0s;
                    caret-color: #ffffff;
                }

                /* ---------- Glass wipe overlay ---------- */
                .glass-wipe {
                    position: fixed;
                    top: 0;
                    bottom: 0;
                    left: -30vw;
                    width: 160vw;
                    z-index: 50;
                    pointer-events: none;
                    background: linear-gradient(
                        100deg,
                        rgba(76, 54, 160, 0.50) 0%,
                        rgba(22, 19, 44, 0.58) 50%,
                        rgba(36, 70, 170, 0.50) 100%
                    );
                    -webkit-backdrop-filter: blur(28px) saturate(1.6);
                    backdrop-filter: blur(28px) saturate(1.6);
                    box-shadow:
                        inset 2px 0 0 rgba(255, 255, 255, 0.38),
                        inset -2px 0 0 rgba(255, 255, 255, 0.38),
                        0 0 90px rgba(139, 92, 246, 0.35);
                    will-change: transform;
                }

                .glass-wipe::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        90deg,
                        transparent 38%,
                        rgba(255, 255, 255, 0.10) 50%,
                        transparent 62%
                    );
                }

                .glass-wipe-cover {
                    animation: wipeCover 0.5s cubic-bezier(0.7, 0, 0.3, 1) both;
                }

                .glass-wipe-reveal {
                    animation: wipeReveal 0.8s cubic-bezier(0.7, 0, 0.3, 1) both;
                }

                @media (prefers-reduced-motion: reduce) {
                    .auth-card,
                    .auth-card.card-from-wipe,
                    .auth-card.card-leaving,
                    .welcome-panel,
                    .form-panel,
                    .ambient-float,
                    .bg-drift,
                    .glass-sheen,
                    .crack-pulse,
                    .error-shake,
                    .field-in {
                        animation: none;
                    }

                    .glass-wipe {
                        display: none;
                    }
                }

                /* ---------- Tablet: keep the desktop split layout, scaled up ---------- */
                @media (min-width: 768px) and (max-width: 1023px) {
                    .auth-card {
                        --field-h: 44px;
                        --gap: 16px;
                        --head-mb: 22px;
                        --foot-mt: 20px;
                        width: min(860px, 96vw);
                        height: min(660px, 90vh);
                        height: min(660px, 90dvh);
                    }

                    .welcome-panel {
                        padding: 28px 44px 28px 36px;
                    }

                    .form-panel {
                        padding: 28px 36px 28px 44px;
                    }

                    .form-panel .auth-input {
                        font-size: 14px;
                    }

                    .form-panel .form-title {
                        font-size: 28px;
                    }
                }

                /* ---------- Mobile: single glass card, never scrolls ---------- */
                @media (max-width: 767px) {
                    .auth-page {
                        padding: 14px;
                    }

                    .auth-card {
                        --field-h: 44px;
                        --gap: 12px;
                        --head-mb: 16px;
                        --foot-mt: 16px;
                        grid-template-columns: minmax(0, 1fr);
                        width: min(420px, 100%);
                        height: auto;
                        max-height: 100%;
                        border-radius: 20px !important;
                    }

                    .welcome-panel,
                    .split-decor {
                        display: none;
                    }

                    .form-panel {
                        padding: 28px 26px;
                    }

                    .form-panel .mobile-logo {
                        display: flex;
                    }

                    .form-panel .auth-input {
                        font-size: 16px;
                    }

                    .form-panel .auth-input::placeholder {
                        font-size: 14px;
                    }

                    .form-panel .form-title {
                        font-size: 26px;
                    }
                }

                /* ---------- Short screens (phones, small tablets): tighten spacing ---------- */
                @media (max-width: 1023px) and (max-height: 700px) {
                    .auth-card {
                        --field-h: 40px;
                        --gap: 10px;
                        --head-mb: 12px;
                        --foot-mt: 12px;
                    }

                    .form-panel {
                        padding-top: 20px;
                        padding-bottom: 20px;
                    }
                }

                @media (max-width: 1023px) and (max-height: 600px) {
                    .auth-card {
                        --field-h: 36px;
                        --gap: 8px;
                        --head-mb: 10px;
                        --foot-mt: 10px;
                    }

                    .form-panel .mobile-logo {
                        margin-bottom: 10px;
                    }

                    .form-sub,
                    .form-eyebrow {
                        display: none;
                    }
                }

                @media (max-width: 1023px) and (max-height: 480px) {
                    .auth-card {
                        --field-h: 34px;
                        --gap: 6px;
                        --head-mb: 8px;
                        --foot-mt: 8px;
                    }

                    .form-panel {
                        padding-top: 14px;
                        padding-bottom: 14px;
                    }

                    .form-panel .mobile-logo {
                        display: none;
                    }

                    .welcome-panel {
                        padding-top: 14px;
                        padding-bottom: 14px;
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
                className={`auth-card relative z-10 overflow-hidden rounded-[22px] border border-white/[0.18] bg-[#12101c]/40 shadow-[0_30px_80px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.22)] backdrop-blur-[30px] backdrop-saturate-150 ${
                    enterDir ? "card-from-wipe" : ""
                } ${leaving ? "card-leaving" : ""}`}
            >

                {/* Glass reflections */}
                <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-gradient-to-br from-white/[0.10] via-transparent to-white/[0.02]" />

                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

                {/* Moving sheen */}
                <div className="glass-sheen pointer-events-none absolute inset-y-0 left-0 z-0 w-1/4 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

                {/* Cursor spotlight */}
                <div className="card-spotlight pointer-events-none absolute inset-0 z-0" />

                {/* Slanted glass crack + welcome panel shading (desktop / tablet) */}
                <svg
                    className="split-decor pointer-events-none absolute inset-0 z-0 h-full w-full"
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

                {/* LEFT PANEL - WELCOME BACK (hidden on phones) */}
                <section className="welcome-panel relative z-10">

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
                        onClick={(e) => handleSwitchClick(e, "/login", "back")}
                        className="field-in field-in-4 group relative mt-6 inline-flex h-[38px] items-center gap-2.5 overflow-hidden rounded-full border border-white/[0.22] bg-gradient-to-b from-white/[0.10] to-white/[0.03] px-5 text-[12px] font-semibold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/50 hover:from-violet-400/20 hover:to-indigo-500/10 hover:shadow-[0_8px_25px_rgba(139,92,246,0.22)]"
                    >
                        <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[400%]" />

                        <span className="relative">Back to Login</span>

                        <ArrowRight
                            size={14}
                            className="relative transition-transform duration-300 group-hover:translate-x-1"
                        />
                    </Link>
                </section>

                {/* RIGHT PANEL - CREATE ACCOUNT */}
                <section className="form-panel relative z-10">

                    {/* Logo (phones only, since the welcome panel is hidden there) */}
                    <div className="mobile-logo field-in field-in-1">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-300/30 bg-gradient-to-br from-violet-500/30 to-blue-500/20 shadow-[0_0_18px_rgba(139,92,246,0.25)]">
                            <Wallet size={15} className="text-violet-200" />
                        </div>

                        <span className="text-[14px] font-bold tracking-tight">
                            Expense<span className="text-violet-400">Flow</span>
                        </span>
                    </div>

                    <div className="form-head field-in field-in-1">
                        <p className="form-eyebrow text-[10px] font-semibold tracking-[0.2em] text-violet-400">
                            PERSONAL EXPENSE TRACKER
                        </p>

                        <h1 className="form-title mt-1.5 text-[24px] font-bold tracking-tight">
                            Create Account
                        </h1>

                        <p className="form-sub mt-1 text-[11px] leading-relaxed text-slate-400">
                            Start organizing and tracking your expenses.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="form-stack w-full">

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
                                    autoComplete="name"
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
                                    autoComplete="email"
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
                                    autoComplete="new-password"
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
                                    autoComplete="new-password"
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

                    <p className="form-foot field-in field-in-7 text-center text-[11px] text-slate-400">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            onClick={(e) => handleSwitchClick(e, "/login", "back")}
                            className="font-semibold text-white underline underline-offset-2 transition-colors hover:text-violet-300"
                        >
                            Log in
                        </Link>
                    </p>
                </section>
            </div>

            {/* Glass transition pane */}
            {(leaving || revealing) && (
                <div
                    aria-hidden="true"
                    className={`glass-wipe ${
                        leaving ? "glass-wipe-cover" : "glass-wipe-reveal"
                    }`}
                    style={wipeVars}
                />
            )}
        </main>
    );
}

export default RegisterPage;
