
import { ClientSession, Types } from "mongoose";
import Envelope from "../models/envelope.model.js";
import Category from "../models/category.model.js";

interface CreateEnvelopeData {
    name: string;
    categoryId: string;
    allocatedAmount: number;
    month: number;
    year: number;
    description?: string;
}

export const createEnvelope = async (
    userId: string,
    data: CreateEnvelopeData
) => {
    const {
        name,
        categoryId,
        allocatedAmount,
        month,
        year,
        description
    } = data;

    if (!name?.trim()) {
        throw new Error("Envelope name is required");
    }

    if (!Types.ObjectId.isValid(categoryId)) {
        throw new Error("Invalid category ID");
    }

    if (!Number.isFinite(allocatedAmount) || allocatedAmount <= 0) {
        throw new Error("Allocated amount must be greater than zero");
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new Error("Invalid month");
    }

    if (!Number.isInteger(year) || year < 2000) {
        throw new Error("Invalid year");
    }

    const category = await Category.findOne({
        _id: categoryId,
        userId
    });

    if (!category) {
        throw new Error("Category not found");
    }

    return Envelope.create({
        userId,
        name,
        categoryId,
        allocatedAmount,
        spentAmount: 0,
        month,
        year,
        description
    });
};

export const getEnvelopes = async (
    userId: string,
    month: number,
    year: number
) => {
    const envelopes = await Envelope.find({
        userId,
        month,
        year
    }).populate("categoryId", "name");

    return envelopes.map((envelope) => {
        const remaining =
            envelope.allocatedAmount - envelope.spentAmount;

        return {
            ...envelope.toObject(),
            remaining,
            exceeded: remaining < 0,
            progressPercentage:
                envelope.allocatedAmount > 0
                    ? Math.round(
                        (envelope.spentAmount /
                            envelope.allocatedAmount) * 100
                    )
                    : 0
        };
    });
};

export const updateEnvelope = async (
    envelopeId: string,
    userId: string,
    data: Partial<CreateEnvelopeData>
) => {
    if (!Types.ObjectId.isValid(envelopeId)) {
        throw new Error("Invalid envelope ID");
    }

    if (data.categoryId) {
        if (!Types.ObjectId.isValid(data.categoryId)) {
            throw new Error("Invalid category ID");
        }

        const category = await Category.findOne({
            _id: data.categoryId,
            userId
        });

        if (!category) {
            throw new Error("Category not found");
        }
    }

    if (data.allocatedAmount !== undefined &&
        (!Number.isFinite(data.allocatedAmount) ||
            data.allocatedAmount <= 0)) {
        throw new Error("Allocated amount must be greater than zero");
    }

    const envelope = await Envelope.findOneAndUpdate(
        { _id: envelopeId, userId },
        data,
        { new: true, runValidators: true }
    );

    if (!envelope) {
        throw new Error("Envelope not found");
    }

    return envelope;
};

export const deleteEnvelope = async (
    envelopeId: string,
    userId: string
) => {
    if (!Types.ObjectId.isValid(envelopeId)) {
        throw new Error("Invalid envelope ID");
    }

    const envelope = await Envelope.findOneAndDelete({
        _id: envelopeId,
        userId
    });

    if (!envelope) {
        throw new Error("Envelope not found");
    }

    return envelope;
};

// Used by the transaction service to keep envelope spending synchronized.
export const adjustEnvelopeSpending = async (
    userId: string,
    categoryId: Types.ObjectId,
    date: Date,
    amountChange: number,
    session: ClientSession
) => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const envelope = await Envelope.findOne({
        userId,
        categoryId,
        month,
        year
    }).session(session);

    // An expense can exist without an envelope.
    if (!envelope) return;

    const newSpentAmount = envelope.spentAmount + amountChange;

    if (newSpentAmount < 0) {
        throw new Error("Envelope spending cannot be negative");
    }

    envelope.spentAmount = newSpentAmount;
    await envelope.save({ session });
};
