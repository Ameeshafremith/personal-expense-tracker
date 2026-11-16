
import { Request, Response } from "express";
import {
    createWallet,
    getWallets,
    getWalletById,
    updateWallet,
    deleteWallet
} from "../services/wallet.service.js";

const validWalletTypes = [
    "cash",
    "bank_account",
    "credit_card",
    "digital_wallet"
];

// Create wallet
export const addWallet = async (req: Request, res: Response) => {
    try {
        const {
            name,
            type,
            institutionName,
            accountNickname,
            lastFourDigits,
            openingBalance,
            creditLimit,
            currency
        } = req.body;

        if (!name || !type) {
            return res.status(400).json({
                success: false,
                message: "Wallet name and type are required"
            });
        }

        if (!validWalletTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid wallet type"
            });
        }

        if (
            openingBalance !== undefined &&
            (!Number.isFinite(Number(openingBalance)) ||
                Number(openingBalance) < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Opening balance must be a non-negative number"
            });
        }

        if (
            type === "credit_card" &&
            creditLimit !== undefined &&
            (!Number.isFinite(Number(creditLimit)) ||
                Number(creditLimit) < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Credit limit must be a non-negative number"
            });
        }

        const wallet = await createWallet(req.user!.userId, {
            name,
            type,
            institutionName,
            accountNickname,
            lastFourDigits,
            openingBalance: Number(openingBalance ?? 0),
            creditLimit:
                creditLimit === undefined ? undefined : Number(creditLimit),
            currency
        });

        return res.status(201).json({
            success: true,
            message: "Wallet created successfully",
            data: wallet
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create wallet"
        });
    }
};

// Get all wallets
export const getAllWallets = async (req: Request, res: Response) => {
    try {
        const wallets = await getWallets(req.user!.userId);

        const totalAvailableMoney = wallets
            .filter(wallet => wallet.type !== "credit_card")
            .reduce((total, wallet) => total + wallet.currentBalance, 0);

        const totalAvailableCredit = wallets
            .filter(wallet => wallet.type === "credit_card")
            .reduce(
                (total, wallet) =>
                    total + Math.max(
                        0,
                        (wallet.creditLimit || 0) -
                        (wallet.outstandingBalance || 0)
                    ),
                0
            );

        return res.status(200).json({
            success: true,
            data: {
                wallets,
                totalAvailableMoney,
                totalAvailableCredit
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve wallets"
        });
    }
};

// Get wallet by ID
export const getSingleWallet = async (req: Request, res: Response) => {
    try {
        const wallet = await getWalletById(
            String(req.params.walletId),
            req.user!.userId
        );

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: wallet
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Update wallet
export const editWallet = async (req: Request, res: Response) => {
    try {
        const {
            name,
            institutionName,
            accountNickname,
            lastFourDigits,
            creditLimit,
            currency
        } = req.body;

        if (
            name === undefined &&
            institutionName === undefined &&
            accountNickname === undefined &&
            lastFourDigits === undefined &&
            creditLimit === undefined &&
            currency === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one field to update"
            });
        }

        if (
            creditLimit !== undefined &&
            (!Number.isFinite(Number(creditLimit)) ||
                Number(creditLimit) < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Credit limit must be a non-negative number"
            });
        }

        const updateData: Record<string, unknown> = {};

        if (name !== undefined) updateData.name = name;
        if (institutionName !== undefined) updateData.institutionName = institutionName;
        if (accountNickname !== undefined) updateData.accountNickname = accountNickname;
        if (lastFourDigits !== undefined) updateData.lastFourDigits = lastFourDigits;
        if (creditLimit !== undefined) updateData.creditLimit = Number(creditLimit);
        if (currency !== undefined) updateData.currency = currency;

        const wallet = await updateWallet(
            String(req.params.walletId),
            req.user!.userId,
            updateData
        );

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Wallet updated successfully",
            data: wallet
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to update wallet"
        });
    }
};

// Delete wallet
export const removeWallet = async (req: Request, res: Response) => {
    try {
        const wallet = await deleteWallet(
            String(req.params.walletId),
            req.user!.userId
        );

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Wallet deleted successfully"
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to delete wallet"
        });
    }
};
