import express from "express";
import {
  allocateStock,
  getBranchInventory,
  requestTransfer,
  getStockTransactions,
  deductStock
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

router.get(
  "/branch/:branchId",
  authMiddleware,
  allowRoles("admin", "manager"),
  getBranchInventory,
);
router.post(
  "/transfer",
  authMiddleware,
  allowRoles("manager", "admin"),
  requestTransfer,
);

router.post(
  "/delete",
  authMiddleware,
  allowRoles("admin"),
  deductStock,
);

export default router;
