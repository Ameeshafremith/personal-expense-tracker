import { Schema, model, Types } from "mongoose";

interface ICategory {
    name: string;
    description?: string;
    userId: Types.ObjectId;
}

const categorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },

        description: {
            type: String,
            trim: true,
            maxlength: 200
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

// Prevent duplicate category names for the same user
categorySchema.index(
    { name: 1, userId: 1 },
    { unique: true }
);

const Category = model<ICategory>("Category", categorySchema);

export default Category;