
import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { getExpenseReportData } from "../services/report.service.js";

// Generate a PDF expense report
export const generateExpenseReport = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { startDate, endDate } = req.query;

        // Check required dates
        if (
            typeof startDate !== "string" ||
            typeof endDate !== "string"
        ) {
            res.status(400).json({
                success: false,
                message: "Start date and end date are required"
            });
            return;
        }

        // Accept date values in YYYY-MM-DD format
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;

        if (
            !datePattern.test(startDate) ||
            !datePattern.test(endDate)
        ) {
            res.status(400).json({
                success: false,
                message: "Dates must use YYYY-MM-DD format"
            });
            return;
        }

        const parsedStartDate = new Date(`${startDate}T00:00:00.000Z`);
        const parsedEndDate = new Date(`${endDate}T23:59:59.999Z`);

        // Validate actual calendar dates
        if (
            Number.isNaN(parsedStartDate.getTime()) ||
            parsedStartDate.toISOString().slice(0, 10) !== startDate ||
            Number.isNaN(parsedEndDate.getTime()) ||
            parsedEndDate.toISOString().slice(0, 10) !== endDate
        ) {
            res.status(400).json({
                success: false,
                message: "Please provide valid calendar dates"
            });
            return;
        }

        // Validate date range
        if (parsedStartDate > parsedEndDate) {
            res.status(400).json({
                success: false,
                message: "Start date cannot be later than end date"
            });
            return;
        }

        // Retrieve only the authenticated user's expenses
        const report = await getExpenseReportData(
            req.user!.userId,
            {
                startDate: parsedStartDate,
                endDate: parsedEndDate
            }
        );

        // Configure PDF response headers
        res.status(200);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="expense-report.pdf"'
        );

        const pdf = new PDFDocument({
            size: "A4",
            margin: 50
        });

        pdf.pipe(res);

        // Report heading
        pdf.fontSize(20)
            .font("Helvetica-Bold")
            .text("Personal Expense Tracker", {
                align: "center"
            });

        pdf.moveDown(0.5);

        pdf.fontSize(16)
            .text("Expense Report", {
                align: "center"
            });

        pdf.moveDown();

        // Report date range
        pdf.fontSize(10)
            .font("Helvetica")
            .text(`From: ${startDate}`);

        pdf.text(`To: ${endDate}`);

        pdf.moveDown();

        pdf.fontSize(12)
            .font("Helvetica-Bold")
            .text(`Total Expenses: ${report.expenseCount}`);

        pdf.text(
            `Total Spending: Rs. ${report.totalAmount.toFixed(2)}`
        );

        pdf.moveDown();

        // Table heading
        const titleX = 50;
        const dateX = 245;
        const categoryX = 335;
        const amountX = 465;

        const drawTableHeader = () => {
            pdf.font("Helvetica-Bold")
                .fontSize(10);

            pdf.text("Title", titleX, pdf.y);
            pdf.text("Date", dateX, pdf.y);
            pdf.text("Category", categoryX, pdf.y);
            pdf.text("Amount (Rs.)", amountX, pdf.y);

            pdf.moveDown(1.5);

            pdf.moveTo(50, pdf.y)
                .lineTo(545, pdf.y)
                .stroke();

            pdf.moveDown(0.5);
        };

        drawTableHeader();

        // Expense rows
        for (const expense of report.expenses) {
            if (pdf.y > 740) {
                pdf.addPage();
                drawTableHeader();
            }

            const categoryName =
                expense.categoryId?.name ?? "Uncategorized";

            const expenseDate = expense.date
                .toISOString()
                .slice(0, 10);

            const rowY = pdf.y;

            pdf.font("Helvetica")
                .fontSize(9);

            pdf.text(expense.title, titleX, rowY, {
                width: 185
            });

            pdf.text(expenseDate, dateX, rowY);

            pdf.text(categoryName, categoryX, rowY, {
                width: 120
            });

            pdf.text(
                expense.amount.toFixed(2),
                amountX,
                rowY
            );

            pdf.moveDown(1.5);
        }

        // Empty report message
        if (report.expenses.length === 0) {
            pdf.font("Helvetica")
                .fontSize(11)
                .text("No expenses found for this date range.");
        }

        // Finish PDF generation
        pdf.end();

    } catch (error) {
        console.error("PDF report error:", error);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to generate expense report"
            });
        } else {
            res.destroy(
                error instanceof Error ? error : undefined
            );
        }
    }
};
