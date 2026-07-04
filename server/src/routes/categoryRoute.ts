import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "../controllers/category";

import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = Router();

router.post("/create-category", authMiddleware, allowRoles("admin"), createCategory);

router.get("/", authMiddleware, getAllCategories);

router.get("/:id", authMiddleware, getCategoryById);

router.put(
  "/update-category/:id",
  authMiddleware,
  allowRoles("admin"),
  updateCategory,
);

router.delete(
  "/delete-category/:id",
  authMiddleware,
  allowRoles("admin"),
  deleteCategory,
);

export default router;
