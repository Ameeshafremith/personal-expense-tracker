
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, clearAuthError } from "../features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../app/hooks";

function LoginPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { loading, error } = useAppSelector((state) => state.auth);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            await dispatch(loginUser({ email, password })).unwrap();
            navigate("/dashboard");
        } catch {
            // The error is displayed from Redux state.
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#0b1020] px-4 py-10 text-white">
            <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#151c31] shadow-2xl md:grid-cols-2">

                <section className="hidden flex-col justify-between bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-800 p-12 md:flex">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-200">
                            Personal Finance
                        </p>

                        <h1 className="mt-8 text-4xl font-bold leading-tight">
                            Take control of your money.
                        </h1>

                        <p className="mt-5 leading-7 text-indigo-100">
                            Track your expenses, organize your spending,
                            and understand where your money goes.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/20 bg-white/10 p-6">
                        <p className="text-lg font-medium">
                            Your money. Your decisions.
                        </p>
                        <p className="mt-2 text-sm text-indigo-100">
                            A smarter way to manage everyday expenses.
                        </p>
                    </div>
                </section>

                <section className="p-8 sm:p-12">
                    <div className="mb-10">
                        <p className="text-sm font-semibold text-violet-400">
                            PERSONAL EXPENSE TRACKER
                        </p>

                        <h2 className="mt-4 text-3xl font-bold">
                            Welcome back
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                            Sign in to access your expense dashboard.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                                Email address
                            </label>

                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    dispatch(clearAuthError());
                                }}
                                placeholder="you@example.com"
                                className="w-full rounded-xl border border-slate-700 bg-[#0d1426] px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                                Password
                            </label>

                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    dispatch(clearAuthError());
                                }}
                                placeholder="Enter your password"
                                className="w-full rounded-xl border border-slate-700 bg-[#0d1426] px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>

                        {error && (
                            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-400">
                        Don't have an account?{" "}
                        <Link to="/register" className="font-semibold text-violet-400 hover:text-violet-300">
                            Create account
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}

export default LoginPage;
