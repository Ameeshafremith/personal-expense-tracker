
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../app/hooks";

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

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#0b1020] px-4 py-10 text-white">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#151c31] p-8 shadow-2xl sm:p-12">

                <p className="text-sm font-semibold tracking-[0.2em] text-violet-400">
                    PERSONAL EXPENSE TRACKER
                </p>

                <h1 className="mt-5 text-3xl font-bold">
                    Create your account
                </h1>

                <p className="mt-2 text-sm text-slate-400">
                    Start organizing and tracking your expenses.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div>
                        <label htmlFor="name" className="mb-2 block text-sm text-slate-300">
                            Full name
                        </label>
                        <input
                            id="name"
                            type="text"
                            required
                            maxLength={80}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full rounded-xl border border-slate-700 bg-[#0d1426] px-4 py-3 outline-none focus:border-violet-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="register-email" className="mb-2 block text-sm text-slate-300">
                            Email address
                        </label>
                        <input
                            id="register-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full rounded-xl border border-slate-700 bg-[#0d1426] px-4 py-3 outline-none focus:border-violet-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="register-password" className="mb-2 block text-sm text-slate-300">
                            Password
                        </label>
                        <input
                            id="register-password"
                            type="password"
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            className="w-full rounded-xl border border-slate-700 bg-[#0d1426] px-4 py-3 outline-none focus:border-violet-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirm-password" className="mb-2 block text-sm text-slate-300">
                            Confirm password
                        </label>
                        <input
                            id="confirm-password"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                            className="w-full rounded-xl border border-slate-700 bg-[#0d1426] px-4 py-3 outline-none focus:border-violet-500"
                        />
                    </div>

                    {(formError || error) && (
                        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                            {formError || error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-semibold transition hover:brightness-110 disabled:opacity-60"
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </form>

                <p className="mt-7 text-center text-sm text-slate-400">
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold text-violet-400 hover:text-violet-300">
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default RegisterPage;
