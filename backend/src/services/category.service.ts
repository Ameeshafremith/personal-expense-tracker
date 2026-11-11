
import { Types } from "mongoose";
import Category from "../models/category.model.js";
import Expense from "../models/expense.model.js";

interface CreateCategoryData {
    name: string;
    description?: string;
}

interface UpdateCategoryData {
    name?: string;
    description?: string;
}

// Create a category
export const createCategory = async (
    userId: string,
    data: CreateCategoryData
) => {
    return await Category.create({
        name: data.name,
        description: data.description,
        userId: new Types.ObjectId(userId)
    });
};

// Get all categories belonging to a user
export const getUserCategories = async (userId: string) => {
    return await Category.find({ userId }).sort({ createdAt: -1 });
};

// Update a category belonging to a user
export const updateCategory = async (
    userId: string,
    categoryId: string,
    data: UpdateCategoryData
) => {
    return await Category.findOneAndUpdate(
        {
            _id: categoryId,
            userId
        },
        data,
        {
            new: true,
            runValidators: true
        }
    );
};

// Delete a category belonging to a user
export const deleteCategory = async (
    userId: string,
    categoryId: string
) => {
    // Check whether this category is used by any expenses
    const linkedExpense = await Expense.exists({
        userId,
        categoryId
    });

    // Prevent deletion if expenses are linked
    if (linkedExpense) {
        return {
            blocked: true,
            deletedCategory: null
        };
    }

    // Delete the category if it is not being used
    const deletedCategory = await Category.findOneAndDelete({
        _id: categoryId,
        userId
    });

    return {
        blocked: false,
        deletedCategory
    };
};
