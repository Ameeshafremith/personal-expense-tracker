
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reportRoutes from "./routes/report.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import incomeRoutes from "./routes/income.routes.js";
import budgetRoutes from "./routes/budget.routes.js";
import envelopeRoutes from "./routes/envelope.routes.js";
import savingsRoutes from "./routes/savings.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import financialYearRoutes from "./routes/financialYear.routes.js";
import simulatorRoutes from "./routes/simulator.routes.js";
import profileRoutes from "./routes/profile.routes.js";

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

// Main API health-check route
app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Personal Expense Tracker API is running!",
    });
});

// Reuse the MongoDB connection across serverless requests
let dbConnectionPromise: Promise<void> | null = null;

app.use(async (_req, res, next) => {
    try {
        if (!dbConnectionPromise) {
            dbConnectionPromise = connectDB().catch((error) => {
                dbConnectionPromise = null;
                throw error;
            });
        }

        await dbConnectionPromise;
        next();
    } catch (error) {
        console.error("Database connection failed:", error);

        res.status(503).json({
            success: false,
            message: "Database connection unavailable. Please try again.",
        });
    }
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Category routes
app.use("/api/categories", categoryRoutes);

// Expense routes
app.use("/api/expenses", expenseRoutes);

// Dashboard routes
app.use("/api/dashboard", dashboardRoutes);

// Report routes
app.use("/api/reports", reportRoutes);

// Wallet routes
app.use("/api/wallets", walletRoutes);

// Transaction routes
app.use("/api/transactions", transactionRoutes);

// Income routes
app.use("/api/incomes", incomeRoutes);

// Budget routes
app.use("/api/budgets", budgetRoutes);

// Envelope routes
app.use("/api/envelopes", envelopeRoutes);

// Savings routes
app.use("/api/savings", savingsRoutes);

// Calendar routes
app.use("/api/calendar", calendarRoutes);

// Financial year routes
app.use("/api/financial-year", financialYearRoutes);

// Simulator routes
app.use("/api/simulator", simulatorRoutes);

// Profile routes
app.use("/api/profile", profileRoutes);

export default app;

// Start a local server during development.
// Vercel imports the app without starting a separate listener.
if (process.env.NODE_ENV !== "production") {
    const PORT = Number(process.env.PORT) || 5000;

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
