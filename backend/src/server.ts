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
const PORT = Number(process.env.PORT) || 5000;

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Main API route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Personal Expense Tracker API is running!"
    });
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

app.use("/api/wallets", walletRoutes);

app.use("/api/transactions", transactionRoutes);

app.use("/api/incomes", incomeRoutes);

app.use("/api/budgets", budgetRoutes);

app.use("/api/envelopes", envelopeRoutes);

app.use("/api/savings", savingsRoutes);

app.use("/api/calendar", calendarRoutes);

app.use("/api/financial-year", financialYearRoutes);

app.use("/api/simulator", simulatorRoutes);

app.use("/api/profile", profileRoutes);

const startServer = async (): Promise<void> => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();