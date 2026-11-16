
import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ArrowDownLeft,
    ArrowUpRight,
    ArrowLeftRight,
    Clock,
} from "lucide-react";
import api from "../services/api";

interface CalendarTransaction {
    _id: string;
    title: string;
    type: "income" | "expense" | "transfer";
    amount: number;
    date: string;
}

interface CalendarIncome {
    _id: string;
    title: string;
    amount: number;
    status: "expected" | "received";
    expectedDate: string;
    receivedDate?: string;
}

interface CalendarItem {
    id: string;
    title: string;
    amount: number;
    date: string;
    type: "income" | "expense" | "transfer" | "expected";
}

function dateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getDateKey(value: string) {
    return dateKey(new Date(value));
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: "LKR",
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatSelectedDate(value: string) {
    const date = new Date(`${value}T12:00:00`);

    return date.toLocaleDateString("en-LK", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function DashboardCalendar() {
    const [transactions, setTransactions] = useState<CalendarTransaction[]>([]);
    const [incomes, setIncomes] = useState<CalendarIncome[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const today = new Date();

    const [currentMonth, setCurrentMonth] = useState(
        new Date(today.getFullYear(), today.getMonth(), 1)
    );

    const [selectedDate, setSelectedDate] = useState(dateKey(today));

    useEffect(() => {
        const fetchCalendarData = async () => {
            try {
                setLoading(true);
                setError("");

                const [transactionResponse, incomeResponse] =
                    await Promise.all([
                        api.get("/transactions"),
                        api.get("/incomes"),
                    ]);

                setTransactions(transactionResponse.data.data || []);
                setIncomes(incomeResponse.data.data || []);
            } catch (err: any) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load calendar information."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchCalendarData();
    }, []);

    const calendarItems = useMemo<CalendarItem[]>(() => {
        const transactionItems: CalendarItem[] = transactions.map(
            (transaction) => ({
                id: transaction._id,
                title: transaction.title,
                amount: transaction.amount,
                date: getDateKey(transaction.date),
                type: transaction.type,
            })
        );

        // Only expected incomes are added here.
        // Received incomes already appear as income transactions.
        const expectedIncomeItems: CalendarItem[] = incomes
            .filter((income) => income.status === "expected")
            .map((income) => ({
                id: `expected-${income._id}`,
                title: income.title,
                amount: income.amount,
                date: getDateKey(income.expectedDate),
                type: "expected",
            }));

        return [...transactionItems, ...expectedIncomeItems];
    }, [transactions, incomes]);

    const calendarDays = useMemo(() => {
        const firstDay = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            1
        );

        // Monday-first calendar.
        const startOffset = (firstDay.getDay() + 6) % 7;

        const startDate = new Date(
            firstDay.getFullYear(),
            firstDay.getMonth(),
            1 - startOffset
        );

        return Array.from({ length: 42 }, (_, index) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + index);

            return date;
        });
    }, [currentMonth]);

    const selectedItems = calendarItems.filter(
        (item) => item.date === selectedDate
    );

    const monthTransactions = calendarItems.filter((item) => {
        const itemDate = new Date(`${item.date}T12:00:00`);

        return (
            itemDate.getFullYear() === currentMonth.getFullYear() &&
            itemDate.getMonth() === currentMonth.getMonth()
        );
    });

    const monthExpenses = monthTransactions
        .filter((item) => item.type === "expense")
        .reduce((total, item) => total + item.amount, 0);

    const monthIncome = monthTransactions
        .filter(
            (item) => item.type === "income" || item.type === "expected"
        )
        .reduce((total, item) => total + item.amount, 0);

    const changeMonth = (amount: number) => {
        setCurrentMonth(
            (previous) =>
                new Date(
                    previous.getFullYear(),
                    previous.getMonth() + amount,
                    1
                )
        );
    };

    const monthLabel = currentMonth.toLocaleDateString("en-LK", {
        month: "long",
        year: "numeric",
    });

    const glassCard =
        "rounded-3xl border border-white/10 bg-white/[0.055] shadow-[0_8px_32px_rgba(0,0,0,0.20)] backdrop-blur-2xl";

    const typeStyles = {
        income: {
            label: "Income",
            color: "text-emerald-300",
            background: "bg-emerald-400",
            icon: ArrowDownLeft,
        },
        expense: {
            label: "Expense",
            color: "text-rose-300",
            background: "bg-rose-400",
            icon: ArrowUpRight,
        },
        transfer: {
            label: "Transfer",
            color: "text-blue-300",
            background: "bg-blue-400",
            icon: ArrowLeftRight,
        },
        expected: {
            label: "Expected income",
            color: "text-amber-300",
            background: "bg-amber-400",
            icon: Clock,
        },
    };

    return (
        <section className={`${glassCard} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
                <div>
                    <div className="flex items-center gap-2">
                        <CalendarDays className="text-violet-300" size={20} />
                        <h3 className="font-semibold">Financial Calendar</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                        Keep track of your financial activity
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="rounded-xl border border-white/10 bg-white/[0.05] p-2 transition hover:bg-white/10"
                        aria-label="Previous month"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <span className="min-w-32 text-center text-sm font-semibold">
                        {monthLabel}
                    </span>

                    <button
                        onClick={() => changeMonth(1)}
                        className="rounded-xl border border-white/10 bg-white/[0.05] p-2 transition hover:bg-white/10"
                        aria-label="Next month"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-[1.5fr_1fr] lg:p-6">
                <div>
                    <div className="mb-4 grid grid-cols-7 gap-1">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                            (day) => (
                                <div
                                    key={day}
                                    className="py-2 text-center text-xs font-semibold text-slate-400"
                                >
                                    {day}
                                </div>
                            )
                        )}

                        {calendarDays.map((date) => {
                            const key = dateKey(date);
                            const isCurrentMonth =
                                date.getMonth() === currentMonth.getMonth();
                            const isSelected = key === selectedDate;
                            const isToday = key === dateKey(today);

                            const dayItems = calendarItems.filter(
                                (item) => item.date === key
                            );

                            const hasIncome = dayItems.some(
                                (item) =>
                                    item.type === "income" ||
                                    item.type === "expected"
                            );

                            const hasExpense = dayItems.some(
                                (item) => item.type === "expense"
                            );

                            const hasTransfer = dayItems.some(
                                (item) => item.type === "transfer"
                            );

                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedDate(key)}
                                    className={`relative flex min-h-[62px] flex-col items-center rounded-xl border p-2 transition sm:min-h-[76px] ${
                                        isSelected
                                            ? "border-violet-400/60 bg-violet-500/20 shadow-lg shadow-violet-950/20"
                                            : "border-transparent hover:border-white/10 hover:bg-white/[0.05]"
                                    } ${
                                        !isCurrentMonth
                                            ? "opacity-30"
                                            : ""
                                    }`}
                                >
                                    <span
                                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                                            isToday
                                                ? "bg-violet-500 text-white"
                                                : "text-slate-200"
                                        }`}
                                    >
                                        {date.getDate()}
                                    </span>

                                    <div className="mt-2 flex h-2 items-center gap-1">
                                        {hasIncome && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        )}
                                        {hasExpense && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                        )}
                                        {hasTransfer && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                        )}
                                    </div>

                                    {dayItems.length > 0 && (
                                        <span className="mt-1 text-[9px] text-slate-400">
                                            {dayItems.length} item
                                            {dayItems.length > 1 ? "s" : ""}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4">
                        {Object.entries(typeStyles).map(([type, style]) => (
                            <div
                                key={type}
                                className="flex items-center gap-2 text-xs text-slate-400"
                            >
                                <span
                                    className={`h-2 w-2 rounded-full ${style.background}`}
                                />
                                {style.label}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-rose-400/15 bg-rose-500/[0.07] p-4">
                            <p className="text-xs text-rose-200">
                                Monthly expenses
                            </p>
                            <p className="mt-2 text-lg font-bold text-white">
                                {formatCurrency(monthExpenses)}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.07] p-4">
                            <p className="text-xs text-emerald-200">
                                Income & expected
                            </p>
                            <p className="mt-2 text-lg font-bold text-white">
                                {formatCurrency(monthIncome)}
                            </p>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold">Selected day</h4>
                        <p className="mt-1 text-xs text-slate-400">
                            {formatSelectedDate(selectedDate)}
                        </p>
                    </div>

                    {loading ? (
                        <p className="py-8 text-center text-sm text-slate-400">
                            Loading calendar...
                        </p>
                    ) : error ? (
                        <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                            {error}
                        </div>
                    ) : selectedItems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
                            <CalendarDays
                                className="mx-auto text-slate-500"
                                size={26}
                            />
                            <p className="mt-3 text-sm text-slate-400">
                                No financial activity on this day.
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                            {selectedItems.map((item) => {
                                const style = typeStyles[item.type];
                                const Icon = style.icon;

                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="rounded-xl bg-white/[0.06] p-2">
                                                <Icon
                                                    size={17}
                                                    className={style.color}
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {item.title}
                                                </p>
                                                <p
                                                    className={`mt-1 text-xs ${style.color}`}
                                                >
                                                    {style.label}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="whitespace-nowrap text-sm font-semibold">
                                            {formatCurrency(item.amount)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default DashboardCalendar;
