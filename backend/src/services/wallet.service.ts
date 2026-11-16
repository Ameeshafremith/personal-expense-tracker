
import { Types } from "mongoose";
import Wallet, { WalletType } from "../models/wallet.model.js";

interface CreateWalletData {
    name: string;
    type: WalletType;
    institutionName?: string;
    accountNickname?: string;
    lastFourDigits?: string;
    openingBalance?: number;
    creditLimit?: number;
    currency?: string;
}

export const createWallet = async (
    userId: string,
    data: CreateWalletData
) => {
    const openingBalance = data.openingBalance ?? 0;

    if (data.type === "credit_card") {
        return Wallet.create({
            ...data,
            userId,
            openingBalance: 0,
            currentBalance: 0,
            outstandingBalance: 0
        });
    }

    return Wallet.create({
        ...data,
        userId,
        openingBalance,
        currentBalance: openingBalance
    });
};

export const getWallets = async (userId: string) => {
    return Wallet.find({ userId }).sort({ createdAt: -1 });
};

export const getWalletById = async (
    walletId: string,
    userId: string
) => {
    if (!Types.ObjectId.isValid(walletId)) {
        throw new Error("Invalid wallet ID");
    }

    return Wallet.findOne({ _id: walletId, userId });
};

export const updateWallet = async (
    walletId: string,
    userId: string,
    data: Partial<CreateWalletData>
) => {
    if (!Types.ObjectId.isValid(walletId)) {
        throw new Error("Invalid wallet ID");
    }

    return Wallet.findOneAndUpdate(
        { _id: walletId, userId },
        { $set: data },
        { new: true, runValidators: true }
    );
};

export const deleteWallet = async (
    walletId: string,
    userId: string
) => {
    if (!Types.ObjectId.isValid(walletId)) {
        throw new Error("Invalid wallet ID");
    }

    return Wallet.findOneAndDelete({
        _id: walletId,
        userId
    });
};
