
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEnvelope extends Document {
    userId: Types.ObjectId;
    name: string;
    description?: string;
    allocatedAmount: number;
    spentAmount: number;
    month: number;
    year: number;
    createdAt: Date;
    updatedAt: Date;
    categoryId: Types.ObjectId;
}

const envelopeSchema = new Schema<IEnvelope>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 60
        },
        description: {
            type: String,
            trim: true,
            maxlength: 200
        },
        allocatedAmount: {
            type: Number,
            required: true,
            min: 0.01
        },
        spentAmount: {
            type: Number,
            default: 0,
            min: 0
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
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true
        }
    },
    { timestamps: true }
);

envelopeSchema.index(
    {
        userId: 1,
        categoryId: 1,
        month: 1,
        year: 1
    },
    { unique: true }
);

const Envelope = mongoose.model<IEnvelope>(
    "Envelope",
    envelopeSchema
);

export default Envelope;
