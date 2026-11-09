import { Schema, model, Types } from "mongoose";

interface IExpense {
    title: string;
    amount: number;
    date: Date;
    categoryId: Types.ObjectId;
    userId: Types.ObjectId;
}

const expenseSchema = new Schema<IExpense>(
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
            min: [0.01, "Amount must be greater than zero"],
            validate: {
                validator: (value: number) => Number.isFinite(value),
                message: "Amount must be a valid number"
            }
        },

        date: {
            type: Date,
            required: true
        },

        categoryId: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Improve expense searching and sorting
expenseSchema.index({ userId: 1, date: -1 });

expenseSchema.index({
    userId: 1,
    categoryId: 1,
    date: -1
});

const Expense = model<IExpense>("Expense", expenseSchema);

export default Expense;