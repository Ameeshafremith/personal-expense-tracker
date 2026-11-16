
import mongoose, { Schema, Document, Types } from "mongoose";

export type WalletType =
    | "cash"
    | "bank_account"
    | "credit_card"
    | "digital_wallet";

export interface IWallet extends Document {
    name: string;
    type: WalletType;
    userId: Types.ObjectId;
    institutionName?: string;
    accountNickname?: string;
    lastFourDigits?: string;
    openingBalance: number;
    currentBalance: number;
    creditLimit?: number;
    outstandingBalance?: number;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 60
        },

        type: {
            type: String,
            enum: [
                "cash",
                "bank_account",
                "credit_card",
                "digital_wallet"
            ],
            required: true
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        institutionName: {
            type: String,
            trim: true,
            maxlength: 100
        },

        accountNickname: {
            type: String,
            trim: true,
            maxlength: 60
        },

        lastFourDigits: {
            type: String,
            match: /^\d{4}$/
        },

        openingBalance: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        currentBalance: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        creditLimit: {
            type: Number,
            min: 0
        },

        outstandingBalance: {
            type: Number,
            min: 0,
            default: 0
        },

        currency: {
            type: String,
            default: "LKR",
            uppercase: true
        }
    },
    {
        timestamps: true
    }
);

walletSchema.index({ userId: 1 });

const Wallet = mongoose.model<IWallet>("Wallet", walletSchema);

export default Wallet;
