
import mongoose, { Schema, Document, Types } from "mongoose";

export type SavingsGoalStatus = "active" | "completed" | "paused";

export interface ISavingsGoal extends Document {
    name: string;
    description?: string;
    targetAmount: number;
    savedAmount: number;
    targetDate?: Date;
    userId: Types.ObjectId;
    status: SavingsGoalStatus;
    createdAt: Date;
    updatedAt: Date;
}

const savingsGoalSchema = new Schema<ISavingsGoal>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500
        },
        targetAmount: {
            type: Number,
            required: true,
            min: 0.01
        },
        savedAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        targetDate: {
            type: Date
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["active", "completed", "paused"],
            default: "active"
        }
    },
    { timestamps: true }
);

savingsGoalSchema.index({ userId: 1, createdAt: -1 });

const SavingsGoal = mongoose.model<ISavingsGoal>(
    "SavingsGoal",
    savingsGoalSchema
);

export default SavingsGoal;
