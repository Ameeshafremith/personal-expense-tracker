
import mongoose, { Schema, Document, Types } from "mongoose";

export type SavingsContributionType = "contribution" | "withdrawal";

export interface ISavingsContribution extends Document {
    userId: Types.ObjectId;
    goalId: Types.ObjectId;
    walletId: Types.ObjectId;
    type: SavingsContributionType;
    amount: number;
    date: Date;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const savingsContributionSchema = new Schema<ISavingsContribution>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        goalId: {
            type: Schema.Types.ObjectId,
            ref: "SavingsGoal",
            required: true
        },
        walletId: {
            type: Schema.Types.ObjectId,
            ref: "Wallet",
            required: true
        },
        type: {
            type: String,
            enum: ["contribution", "withdrawal"],
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01
        },
        date: {
            type: Date,
            required: true,
            default: Date.now
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500
        }
    },
    { timestamps: true }
);

savingsContributionSchema.index({ userId: 1, goalId: 1, date: -1 });
savingsContributionSchema.index({ walletId: 1 });

const SavingsContribution = mongoose.model<ISavingsContribution>(
    "SavingsContribution",
    savingsContributionSchema
);

export default SavingsContribution;
