// src/routes/categoryRoutes.ts
import express from "express";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
  getCategoriesWithCount,
} from "../controllers/category";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.get("/", authMiddleware, allowRoles("admin", "manager"), getCategories);
router.get(
  "/stats",
  authMiddleware,
  allowRoles("admin", "manager"),
  getCategoryStats,
);
router.get(
  "/with-count",
  authMiddleware,
  allowRoles("admin", "manager"),
  getCategoriesWithCount,
);
router.get(
  "/:id",
  authMiddleware,
  allowRoles("admin", "manager"),
  getCategoryById,
);
router.post("/create", authMiddleware, allowRoles("admin"), createCategory);
router.put("/:id", authMiddleware, allowRoles("admin"), updateCategory);
router.delete("/:id", authMiddleware, allowRoles("admin"), deleteCategory);

export default router;
