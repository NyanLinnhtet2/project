import express from "express";
import {
  getProductStockAcrossBranches,
  createTransferRequest,
  approveTransferRequest,
  rejectTransferRequest,
  getTransfers,
  getProductsForTransfer
} from "../controllers/transfer";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";


const router = express.Router();

router.get("/", authMiddleware, allowRoles("admin", "manager"), getTransfers);
router.get(
  "/products-for-transfer",
  authMiddleware,
  allowRoles("admin", "manager"),
  getProductsForTransfer,
);
router.get(
  "/product-stock/:productId",
  authMiddleware,
  allowRoles("admin", "manager"),
  getProductStockAcrossBranches,
);
router.post(
  "/request",
  authMiddleware,
  allowRoles("manager", "admin"),
  createTransferRequest,
);
router.put(
  "/:id/approve",
  authMiddleware,
  allowRoles("admin"),
  approveTransferRequest,
);
router.put(
  "/:id/reject",
  authMiddleware,
  allowRoles("admin"),
  rejectTransferRequest,
);

export default router;
