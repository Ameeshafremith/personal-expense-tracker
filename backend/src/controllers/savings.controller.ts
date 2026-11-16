
import { Request, Response } from "express";
import {
    createSavingsGoal,
    getSavingsGoals,
    getSavingsGoalById,
    updateSavingsGoal,
    deleteSavingsGoal,
    recordSavingsMovement,
    getSavingsHistory
} from "../services/savings.service.js";

const getErrorStatus = (message: string) => {
    if (message.toLowerCase().includes("not found")) return 404;
    if (
        message.includes("Invalid") ||
        message.includes("required") ||
        message.includes("greater") ||
        message.includes("exceeds") ||
        message.includes("Insufficient") ||
        message.includes("cannot") ||
        message.includes("Cannot") ||
        message.includes("Credit cards")
    ) return 400;

    return 500;
};

export const addSavingsGoal = async (req: Request, res: Response) => {
    try {
        const { name, targetAmount, targetDate, description } = req.body;

        const goal = await createSavingsGoal(
            req.user!.userId,
            { name, targetAmount: Number(targetAmount), targetDate, description }
        );

        res.status(201).json({
            success: true,
            message: "Savings goal created successfully",
            data: goal
        });
    } catch (error: any) {
        res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message
        });
    }
};

export const getAllSavingsGoals = async (req: Request, res: Response) => {
    try {
        const goals = await getSavingsGoals(req.user!.userId);

        res.status(200).json({
            success: true,
            count: goals.length,
            data: goals
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getSingleSavingsGoal = async (req: Request, res: Response) => {
    try {
        const goal = await getSavingsGoalById(
            String(req.params.goalId),
            req.user!.userId
        );

        res.status(200).json({
            success: true,
            data: goal
        });
    } catch (error: any) {
        res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message
        });
    }
};

export const editSavingsGoal = async (req: Request, res: Response) => {
    try {
        const goal = await updateSavingsGoal(
            String(req.params.goalId),
            req.user!.userId,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Savings goal updated successfully",
            data: goal
        });
    } catch (error: any) {
        res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message
        });
    }
};

export const removeSavingsGoal = async (req: Request, res: Response) => {
    try {
        const result = await deleteSavingsGoal(
            String(req.params.goalId),
            req.user!.userId
        );

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error: any) {
        res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message
        });
    }
};

export const addSavingsMovement = async (req: Request, res: Response) => {
    try {
        const { goalId, walletId, amount, type, date, description } = req.body;

        const movement = await recordSavingsMovement(
            req.user!.userId,
            {
                goalId,
                walletId,
                amount: Number(amount),
                type,
                date,
                description
            }
        );

        res.status(201).json({
            success: true,
            message: "Savings movement recorded successfully",
            data: movement
        });
    } catch (error: any) {
        res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message
        });
    }
};

export const getAllSavingsHistory = async (req: Request, res: Response) => {
    try {
        const history = await getSavingsHistory(
            req.user!.userId,
            req.query.goalId ? String(req.query.goalId) : undefined
        );

        res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (error: any) {
        res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message
        });
    }
};
