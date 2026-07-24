import express from "express";
import {
  createDiscountApprovalRequest,
  getMyLatestRequest,
  getPendingApprovals,
  approveRequest,
  rejectRequest,
  cancelRequest,
} from "../controllers/discountApprovalRequest";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

// Cashier/Manager
router.post(
  "/",
  authMiddleware,
  allowRoles("cashier", "manager"),
  createDiscountApprovalRequest,
);
router.get(
  "/mine",
  authMiddleware,
  allowRoles("cashier", "manager"),
  getMyLatestRequest,
);
router.post(
  "/:id/cancel",
  authMiddleware,
  allowRoles("cashier", "manager"),
  cancelRequest,
);

// Manager/Admin inbox
router.get(
  "/pending",
  authMiddleware,
  allowRoles("manager", "admin"),
  getPendingApprovals,
);
router.post(
  "/:id/approve",
  authMiddleware,
  allowRoles("manager", "admin"),
  approveRequest,
);
router.post(
  "/:id/reject",
  authMiddleware,
  allowRoles("manager", "admin"),
  rejectRequest,
);

export default router;
