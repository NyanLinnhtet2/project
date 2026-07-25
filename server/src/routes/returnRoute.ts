import express from "express";
import {
  createReturn,
  getBranchReturns,
  getReturnsOverview,
  getReturnDetail,
} from "../controllers/return";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.post("/", authMiddleware, allowRoles("manager", "admin"), createReturn);
router.get("/", authMiddleware, allowRoles("manager", "admin"), getBranchReturns);

// Admin: cross-branch overview, filter with ?branchId=&startDate=&endDate=
router.get(
  "/overview",
  authMiddleware,
  allowRoles("admin"),
  getReturnsOverview,
);

// Manager/Admin: full detail of one return (line items). Admin passes ?branchId=
router.get(
  "/:id",
  authMiddleware,
  allowRoles("manager", "admin"),
  getReturnDetail,
);

export default router;