
import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware.js";

import {
    addCategory,
    getCategories,
    editCategory,
    removeCategory
} from "../controllers/category.controller.js";

const router = Router();

// All category routes require authentication
router.use(authMiddleware);

// Create category
router.post("/", addCategory);

// Get all categories belonging to the logged-in user
router.get("/", getCategories);

// Update category
router.put("/:categoryId", editCategory);

// Delete category
router.delete("/:categoryId", removeCategory);

export default router;
