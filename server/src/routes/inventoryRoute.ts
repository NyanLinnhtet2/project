// src/routes/inventoryRoutes.ts
import express from "express";
import {
  getInventory,
  getInventoryByBranch,
  addStock,
  updateStock,
  transferStock,
  getInventoryStats,
  getStockTransactions,
  getLowStockItems,
} from "../controllers/inventoryController";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

// Specific routes first
router.get("/stats", authMiddleware, allowRoles("admin", "manager"), getInventoryStats);
router.get("/low-stock", authMiddleware, allowRoles("admin", "manager"), getLowStockItems);
router.get("/transactions", authMiddleware, allowRoles("admin", "manager"), getStockTransactions);
router.get("/branch/:branchName", authMiddleware, allowRoles("admin", "manager"), getInventoryByBranch);

// Main inventory route
router.get("/", authMiddleware, allowRoles("admin", "manager"), getInventory);

// Admin only routes
router.post("/add-stock", authMiddleware, allowRoles("admin"), addStock);
router.put("/update-stock", authMiddleware, allowRoles("admin"), updateStock);
router.post("/transfer", authMiddleware, allowRoles("admin"), transferStock);

export default router;