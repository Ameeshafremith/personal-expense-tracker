
import { useEffect } from "react";
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes
} from "react-router-dom";

import { useAppDispatch } from "./app/hooks";
import { restoreSession } from "./features/auth/authSlice";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ExpensesPage from "./pages/ExpensesPage";
import CategoriesPage from "./pages/CategoriesPage";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import ReportsPage from "./pages/ReportsPage";

import WalletsPage from "./pages/WalletsPage";
import TransactionsPage from "./pages/TransactionsPage";
import BudgetsPage from "./pages/BudgetsPage";
import EnvelopesPage from "./pages/EnvelopesPage";
import IncomePage from "./pages/IncomePage";

//import CalendarPage from "./pages/CalendarPage";
import SavingsPage from "./pages/SavingsPage";
import SimulatorPage from "./pages/SimulatorPage";

import ProfilePage from "./pages/ProfilePage";

import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(restoreSession());
    }, [dispatch]);

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                />

                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                />
                
                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/expenses" element={<ExpensesPage />} />
                        <Route path="/categories" element={<CategoriesPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/wallets" element={<WalletsPage />} />
                        <Route path="/transactions" element={<TransactionsPage />} />
                        <Route path="/budgets" element={<BudgetsPage />} />
                        <Route path="/envelopes" element={<EnvelopesPage />} />
                        <Route path="/income" element={<IncomePage />} />
                        {/* <Route path="/calendar" element={<CalendarPage />} /> */}
                        <Route path="/savings" element={<SavingsPage />} />
                        <Route path="/simulator" element={<SimulatorPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        
                    </Route>
                </Route>

                <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
