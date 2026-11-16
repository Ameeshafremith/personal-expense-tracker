
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBudget extends Document {
    userId: Types.ObjectId;
    categoryId: Types.ObjectId;
    amount: number;
    month: number;
    year: number;
    rolloverEnabled: boolean;
    rolloverAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

const budgetSchema = new Schema<IBudget>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01
        },
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12
        },
        year: {
            type: Number,
            required: true,
            min: 2000
        },
        rolloverEnabled: {
            type: Boolean,
            default: false
        },
        rolloverAmount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    { timestamps: true }
);

budgetSchema.index(
    { userId: 1, categoryId: 1, month: 1, year: 1 },
    { unique: true }
);

const Budget = mongoose.model<IBudget>("Budget", budgetSchema);

export default Budget;
