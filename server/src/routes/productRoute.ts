import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  getProductStats,
} from "../controllers/product";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

// Public routes
router.get("/", authMiddleware, allowRoles("admin", "manager"), getProducts);
router.get(
  "/stats",
  authMiddleware,
  allowRoles("admin", "manager"),
  getProductStats,
);
router.get(
  "/:id",
  authMiddleware,
  allowRoles("admin", "manager"),
  getProductById,
);

// Admin only routes
router.post("/create", authMiddleware, allowRoles("admin"), createProduct);
router.put("/:id", authMiddleware, allowRoles("admin"), updateProduct);
router.delete("/:id", authMiddleware, allowRoles("admin"), deleteProduct);
router.patch(
  "/:id/stock",
  authMiddleware,
  allowRoles("admin"),
  updateProductStock,
);

export default router;
