
import { Request, Response } from "express";
import { simulatePurchase } from "../services/simulator.service.js";

export const runPurchaseSimulation = async (
    req: Request,
    res: Response
) => {
    try {
        const { purchaseName, purchaseAmount } = req.body;

        if (
            purchaseAmount === undefined ||
            !Number.isFinite(Number(purchaseAmount)) ||
            Number(purchaseAmount) <= 0
        ) {
            res.status(400).json({
                success: false,
                message: "A valid purchase amount greater than zero is required"
            });
            return;
        }

        const result = await simulatePurchase(
            req.user!.userId,
            Number(purchaseAmount),
            purchaseName
        );

        res.status(200).json({
            success: true,
            message: "Purchase simulation completed successfully",
            data: result
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to simulate purchase"
        });
    }
};
