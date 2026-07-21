import express from "express";
import {
  allocateStock,
  getBranchInventory,
  requestTransfer,
  getStockTransactions,
  deductStock,
  requestStockEdit,
  getStockEditRequests,
  approveStockEditRequest,
  rejectStockEditRequest,
} from "../controllers/inventory";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.post("/allocate", authMiddleware, allowRoles("admin"), allocateStock);
router.get(
  "/transactions",
  authMiddleware,
  allowRoles("admin", "manager"),
  getStockTransactions,
);
// Manager က Edit Request တင်ခြင်း
router.post(
  "/stock-edit-request",
  authMiddleware,
  allowRoles("manager", "admin"),
  requestStockEdit,
);

// Admin/Manager က Requests list ကြည့်ခြင်း
router.get(
  "/stock-edit-requests",
  authMiddleware,
  allowRoles("admin", "manager"),
  getStockEditRequests,
);

// Admin ချည်း — Approve
router.post(
  "/stock-edit-request/:id/approve",
  authMiddleware,
  allowRoles("admin"),
  approveStockEditRequest,
);

// Admin ချည်း — Reject
router.post(
  "/stock-edit-request/:id/reject",
  authMiddleware,
  allowRoles("admin"),
  rejectStockEditRequest,
);

router.get(
  "/branch/:branchId",
  authMiddleware,
  allowRoles("admin", "manager", "cashier"),
  getBranchInventory,
);
router.post(
  "/transfer",
  authMiddleware,
  allowRoles("manager", "admin"),
  requestTransfer,
);

router.post("/delete", authMiddleware, allowRoles("admin"), deductStock);

export default router;
