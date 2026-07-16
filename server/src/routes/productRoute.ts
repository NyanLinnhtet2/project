import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
} from "../controllers/product";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

// IMPORTANT: Specific routes must come BEFORE dynamic routes

// Get product stats - specific route
router.get(
  "/stats",
  authMiddleware,
  allowRoles("admin", "manager"),
  getProductStats,
);

// Get all products
router.get("/", authMiddleware, allowRoles("admin", "manager"), getProducts);

// Create product - specific route
router.post("/create", authMiddleware, allowRoles("admin"), createProduct);

// Get product by ID - dynamic route (must come AFTER specific routes)
router.get(
  "/:id",
  authMiddleware,
  allowRoles("admin", "manager"),
  getProductById,
);

// Update product - dynamic route
router.put("/:id", authMiddleware, allowRoles("admin"), updateProduct);

// Delete product - dynamic route
router.delete("/:id", authMiddleware, allowRoles("admin"), deleteProduct);

export default router;