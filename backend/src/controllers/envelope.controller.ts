
import { Request, Response } from "express";
import {
    createEnvelope,
    getEnvelopes,
    updateEnvelope,
    deleteEnvelope
} from "../services/envelope.service.js";

const getErrorStatus = (message: string) => {
    if (message.includes("not found")) return 404;

    if (
        message.includes("Invalid") ||
        message.includes("required") ||
        message.includes("must") ||
        message.includes("greater")
    ) {
        return 400;
    }

    return 500;
};

export const addEnvelope = async (req: Request, res: Response) => {
    try {
        const {
            name,
            categoryId,
            allocatedAmount,
            month,
            year,
            description
        } = req.body;

        if (
            !name ||
            !categoryId ||
            allocatedAmount === undefined ||
            month === undefined ||
            year === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Name, category, allocated amount, month and year are required"
            });
        }

        const envelope = await createEnvelope(req.user!.userId, {
            name,
            categoryId,
            allocatedAmount: Number(allocatedAmount),
            month: Number(month),
            year: Number(year),
            description
        });

        return res.status(201).json({
            success: true,
            message: "Money envelope created successfully",
            data: envelope
        });
    } catch (error: any) {
        return res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message
        });
    }
};

export const getAllEnvelopes = async (req: Request, res: Response) => {
    try {
        const month = Number(req.query.month);
        const year = Number(req.query.year);

        if (
            !Number.isInteger(month) ||
            month < 1 ||
            month > 12 ||
            !Number.isInteger(year) ||
            year < 2000
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid month and year are required"
            });
        }

        const envelopes = await getEnvelopes(
            req.user!.userId,
            month,
            year
        );

        return res.status(200).json({
            success: true,
            count: envelopes.length,
            data: envelopes
        });
    } catch (error: any) {
        return res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message
        });
    }
};

export const editEnvelope = async (req: Request, res: Response) => {
    try {
        const envelope = await updateEnvelope(
            String(req.params.envelopeId),
            req.user!.userId,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Money envelope updated successfully",
            data: envelope
        });
    } catch (error: any) {
        return res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message
        });
    }
};

export const removeEnvelope = async (req: Request, res: Response) => {
    try {
        await deleteEnvelope(
            String(req.params.envelopeId),
            req.user!.userId
        );

        return res.status(200).json({
            success: true,
            message: "Money envelope deleted successfully"
        });
    } catch (error: any) {
        return res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message
        });
    }
};
