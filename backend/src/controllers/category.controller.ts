
import { Request, Response } from "express";
import mongoose from "mongoose";

import {
    createCategory,
    getUserCategories,
    updateCategory,
    deleteCategory
} from "../services/category.service.js";

// Create a new category
export const addCategory = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { name, description } = req.body;

        if (!name || typeof name !== "string" || !name.trim()) {
            res.status(400).json({
                success: false,
                message: "Category name is required"
            });
            return;
        }

        if (name.trim().length > 50) {
            res.status(400).json({
                success: false,
                message: "Category name cannot exceed 50 characters"
            });
            return;
        }

        if (
            description !== undefined &&
            (typeof description !== "string" || description.length > 200)
        ) {
            res.status(400).json({
                success: false,
                message: "Description must be a string of maximum 200 characters"
            });
            return;
        }

        const category = await createCategory(req.user!.userId, {
            name: name.trim(),
            description: description?.trim()
        });

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category
        });
    } catch (error) {
        if (
            error instanceof mongoose.Error ||
            (error instanceof Error && error.name === "MongoServerError" &&
                "code" in error && error.code === 11000)
        ) {
            if ("code" in error && error.code === 11000) {
                res.status(409).json({
                    success: false,
                    message: "A category with this name already exists"
                });
                return;
            }
        }

        console.error("Create category error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong while creating the category"
        });
    }
};

// Get all categories belonging to the logged-in user
export const getCategories = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const categories = await getUserCategories(req.user!.userId);

        res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        console.error("Get categories error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong while retrieving categories"
        });
    }
};

// Update a category
export const editCategory = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const categoryId = String(req.params.categoryId);
        const { name, description } = req.body;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            res.status(400).json({
                success: false,
                message: "Invalid category ID"
            });
            return;
        }

        if (name === undefined && description === undefined) {
            res.status(400).json({
                success: false,
                message: "Provide a name or description to update"
            });
            return;
        }

        if (
            name !== undefined &&
            (typeof name !== "string" || !name.trim() || name.trim().length > 50)
        ) {
            res.status(400).json({
                success: false,
                message: "Category name must contain 1–50 characters"
            });
            return;
        }

        if (
            description !== undefined &&
            (typeof description !== "string" || description.length > 200)
        ) {
            res.status(400).json({
                success: false,
                message: "Description must be a string of maximum 200 characters"
            });
            return;
        }

        const category = await updateCategory(
            req.user!.userId,
            categoryId,
            {
                ...(name !== undefined && { name: name.trim() }),
                ...(description !== undefined && { description: description.trim() })
            }
        );

        if (!category) {
            res.status(404).json({
                success: false,
                message: "Category not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category
        });
    } catch (error) {
        if (error instanceof Error && "code" in error && error.code === 11000) {
            res.status(409).json({
                success: false,
                message: "A category with this name already exists"
            });
            return;
        }

        console.error("Update category error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong while updating the category"
        });
    }
};

// Delete a category
export const removeCategory = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const categoryId = String(req.params.categoryId);

        // Validate category ID
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            res.status(400).json({
                success: false,
                message: "Invalid category ID"
            });
            return;
        }

        const result = await deleteCategory(
            req.user!.userId,
            categoryId
        );

        // Category is linked to existing expenses
        if (result.blocked) {
            res.status(409).json({
                success: false,
                message: "Cannot delete this category because it is being used by expenses."
            });
            return;
        }

        // Category does not exist or does not belong to this user
        if (!result.deletedCategory) {
            res.status(404).json({
                success: false,
                message: "Category not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });

    } catch (error) {
        console.error("Delete category error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete category"
        });
    }
};
