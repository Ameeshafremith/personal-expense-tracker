
import mongoose, { Schema, Document, Types } from "mongoose";

export type IncomeFrequency = "one_time" | "monthly";

export type IncomeStatus = "expected" | "received";

export interface IIncome extends Document {
    title: string;
    amount: number;
    frequency: IncomeFrequency;
    status: IncomeStatus;
    userId: Types.ObjectId;
    walletId: Types.ObjectId;
    expectedDate: Date;
    receivedDate?: Date;
    transactionId?: Types.ObjectId;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const incomeSchema = new Schema<IIncome>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01
        },
        frequency: {
            type: String,
            enum: ["one_time", "monthly"],
            required: true
        },
        status: {
            type: String,
            enum: ["expected", "received"],
            default: "expected"
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        walletId: {
            type: Schema.Types.ObjectId,
            ref: "Wallet",
            required: true
        },
        expectedDate: {
            type: Date,
            required: true
        },
        receivedDate: {
            type: Date
        },
        transactionId: {
            type: Schema.Types.ObjectId,
            ref: "Transaction"
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500
        }
    },
    { timestamps: true }
);

incomeSchema.index({ userId: 1, expectedDate: 1 });
incomeSchema.index({ userId: 1, status: 1 });

const Income = mongoose.model<IIncome>("Income", incomeSchema);

export default Income;
