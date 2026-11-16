
import {
    LayoutDashboard,
    Wallet,
    ArrowLeftRight,
    Tags,
    ChartPie,
    Mail,
    PiggyBank,
    TrendingUp,
    Calculator,
    FileChartColumn,
    UserRound,
    ChevronDown,
    Settings,
    Menu,
    X
} from "lucide-react";

import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logoutUser, updateAuthUser } from "../features/auth/authSlice";
import api from "../services/api";

const navigationItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Wallets", path: "/wallets", icon: Wallet },
    { name: "Transactions", path: "/transactions", icon: ArrowLeftRight },
    { name: "Categories", path: "/categories", icon: Tags },
    { name: "Budgets", path: "/budgets", icon: ChartPie },
    { name: "Envelopes", path: "/envelopes", icon: Mail },
    { name: "Savings", path: "/savings", icon: PiggyBank },
    { name: "Income Management", path: "/income", icon: TrendingUp },
    { name: "Simulator", path: "/simulator", icon: Calculator },
    { name: "Reports", path: "/reports", icon: FileChartColumn },
];

function AppLayout() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const user = useAppSelector((state) => state.auth.user);

    const [menuOpen, setMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        setMenuOpen(false);
        setProfileMenuOpen(false);
        navigate("/login", { replace: true });
    };

    useEffect(() => {
        if (!user?.id) return;

        const loadProfile = async () => {
            try {
                const response = await api.get("/profile");
                const profile = response.data.data;

                dispatch(
                    updateAuthUser({
                        name: profile.name,
                        email: profile.email,
                        mobileNumber: profile.mobileNumber,
                        profilePicture: profile.profilePicture,
                    })
                );
            } catch (error) {
                console.error("Failed to load header profile:", error);
            }
        };

        loadProfile();
    }, [dispatch, user?.id]);

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#090D18] text-white">

            {/* Ambient background effects */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-500/20 blur-[120px]" />
                <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-[130px]" />
                <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-400/10 blur-[120px]" />
            </div>

            {/* Fixed Header and Navigation */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05] bg-[#090D18]/70 px-4 py-5 backdrop-blur-2xl sm:px-6">
                <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">

                    {/* Brand */}
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="shrink-0 text-xl font-bold tracking-tight sm:text-2xl"
                    >
                        Expense<span className="text-violet-400">Flow</span>
                    </button>

                    {/* Desktop Floating Navigation */}
                    <nav className="hidden items-center gap-1 rounded-full border border-white/20 bg-white/[0.10] p-2 shadow-[0_8px_40px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-2xl lg:flex">
                        {navigationItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                title={item.name}
                                className={({ isActive }) =>
                                    `flex h-11 items-center justify-center gap-2 rounded-full transition-all duration-300 ${
                                        isActive
                                            ? "border border-violet-300/20 bg-gradient-to-r from-violet-400/30 to-blue-400/20 px-4 text-white shadow-[0_0_20px_rgba(167,139,250,0.18)]"
                                            : "w-11 text-slate-300 hover:bg-white/15 hover:text-white"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon size={21} strokeWidth={1.8} />

                                        {isActive && (
                                            <span className="whitespace-nowrap text-sm font-medium">
                                                {item.name}
                                            </span>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Mobile Menu Button and User Profile */}
                    <div className="relative flex shrink-0 items-center gap-3">

                        {/* Mobile Navigation Toggle */}
                        <button
                            onClick={() => {
                                setMenuOpen((prev) => !prev);
                                setProfileMenuOpen(false);
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
                            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                            aria-expanded={menuOpen}
                            aria-controls="mobile-navigation"
                        >
                            {menuOpen ? (
                                <X size={22} />
                            ) : (
                                <Menu size={22} />
                            )}
                        </button>

                        {/* User Information */}
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-semibold">
                                {user?.name || "User"}
                            </p>
                            <p className="text-xs text-slate-400">
                                Personal Account
                            </p>
                        </div>

                        {/* Profile Picture Button */}
                        <button
                            onClick={() => {
                                setProfileMenuOpen((prev) => !prev);
                                setMenuOpen(false);
                            }}
                            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 p-1.5 transition hover:bg-white/15"
                            aria-label="Open profile menu"
                            aria-expanded={profileMenuOpen}
                        >
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-violet-300/30 bg-gradient-to-br from-violet-500/40 to-blue-500/40 font-semibold text-violet-100">
                                {user?.profilePicture ? (
                                    <img
                                        src={user.profilePicture}
                                        alt="Profile"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    (user?.name || "U").charAt(0).toUpperCase()
                                )}
                            </div>

                            <ChevronDown
                                size={16}
                                className={`hidden text-slate-300 transition-transform sm:block ${
                                    profileMenuOpen ? "rotate-180" : ""
                                }`}
                            />
                        </button>

                        {/* Profile Dropdown */}
                        {profileMenuOpen && (
                            <div className="absolute right-0 top-14 z-[60] w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#151C2E] shadow-2xl shadow-black/40">

                                <div className="border-b border-white/10 px-4 py-4">
                                    <p className="font-semibold text-white">
                                        {user?.name || "User"}
                                    </p>

                                    <p className="mt-1 truncate text-xs text-slate-400">
                                        {user?.email || ""}
                                    </p>
                                </div>

                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            setProfileMenuOpen(false);
                                            navigate("/profile");
                                        }}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-200 transition hover:bg-violet-500/15 hover:text-violet-200"
                                    >
                                        <UserRound size={18} />
                                        My Profile
                                    </button>

                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-rose-300 transition hover:bg-rose-500/10"
                                    >
                                        <Settings size={18} />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation */}
                {menuOpen && (
                    <nav
                        id="mobile-navigation"
                        className="mx-auto mt-4 grid max-w-[600px] grid-cols-2 gap-2 rounded-3xl border border-white/20 bg-[#171E30]/95 p-4 shadow-2xl backdrop-blur-2xl sm:grid-cols-3 lg:hidden"
                    >
                        {navigationItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setMenuOpen(false)}
                                className={({ isActive }) =>
                                    `rounded-2xl px-3 py-3 text-sm ${
                                        isActive
                                            ? "bg-violet-400/20 text-violet-200"
                                            : "text-slate-300 hover:bg-white/10"
                                    }`
                                }
                            >
                                <item.icon
                                    className="mr-2 inline-block"
                                    size={18}
                                    strokeWidth={1.8}
                                />
                                {item.name}
                            </NavLink>
                        ))}

                        <button
                            onClick={handleLogout}
                            className="rounded-2xl px-3 py-3 text-left text-sm text-rose-300 hover:bg-rose-500/10 sm:col-span-3"
                        >
                            Logout
                        </button>
                    </nav>
                )}
            </header>

            {/* Main Page Content */}
            <main className="mx-auto min-h-screen w-full max-w-[1500px] px-4 pb-10 pt-32 sm:px-6 lg:px-10">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/[0.06] px-4 py-5 text-center text-xs text-slate-500">
                ExpenseFlow · Personal Finance Management
            </footer>
        </div>
    );
}

export default AppLayout;
