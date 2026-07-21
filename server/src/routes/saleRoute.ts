import express from "express";
import {
  createSale,
  getMySales,
  getBranchSales,
  getSalesOverview,
  voidSale,
} from "../controllers/sale";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

// Cashier records a sale (Manager can also ring up sales)
router.post(
  "/",
  authMiddleware,
  allowRoles("cashier", "manager"),
  createSale,
);

// Cashier: only their own sales
router.get("/mine", authMiddleware, allowRoles("cashier"), getMySales);

// Manager: all sales in their own branch. Admin: pass ?branchId= to inspect one branch
router.get(
  "/branch",
  authMiddleware,
  allowRoles("manager", "admin"),
  getBranchSales,
);

// Admin: cross-branch overview, filter with ?branchId=&startDate=&endDate=
router.get(
  "/overview",
  authMiddleware,
  allowRoles("admin"),
  getSalesOverview,
);

// Manager/Admin: void a sale and restock its items
router.post(
  "/:id/void",
  authMiddleware,
  allowRoles("manager", "admin"),
  voidSale,
);

export default router;