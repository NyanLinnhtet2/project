import express from "express";
import {
  createMembershipTier,
  getMembershipTiers,
  updateMembershipTier,
  deleteMembershipTier,
} from "../controllers/membershiptier";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.get("/", authMiddleware, allowRoles("cashier", "manager", "admin"), getMembershipTiers);
router.post("/", authMiddleware, allowRoles("admin"), createMembershipTier);
router.patch("/:id", authMiddleware, allowRoles("admin"), updateMembershipTier);
router.delete("/:id", authMiddleware, allowRoles("admin"), deleteMembershipTier);

export default router;