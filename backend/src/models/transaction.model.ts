
import mongoose, { Schema, Document, Types } from "mongoose";

export type TransactionType = "income" | "expense" | "transfer";

export interface ITransaction extends Document {
    title: string;
    type: TransactionType;
    amount: number;
    userId: Types.ObjectId;
    walletId: Types.ObjectId;
    destinationWalletId?: Types.ObjectId;
    categoryId?: Types.ObjectId;
    description?: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        type: {
            type: String,
            enum: ["income", "expense", "transfer"],
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0.01
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

        destinationWalletId: {
            type: Schema.Types.ObjectId,
            ref: "Wallet"
        },

        categoryId: {
            type: Schema.Types.ObjectId,
            ref: "Category"
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500
        },

        date: {
            type: Date,
            required: true,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ walletId: 1 });

const Transaction = mongoose.model<ITransaction>(
    "Transaction",
    transactionSchema
);

export default Transaction;
