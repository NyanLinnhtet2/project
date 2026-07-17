import express from "express";
import {
  allocateStock,
  getBranchInventory,
  requestTransfer,
} from "../controllers/inventory";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.post("/allocate", authMiddleware, allowRoles("admin"), allocateStock);
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

export default router;
