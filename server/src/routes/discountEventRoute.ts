import express from "express";
import {
  createDiscountEvent,
  getDiscountEvents,
  updateDiscountEvent,
  deleteDiscountEvent,
  getMyEffectiveDiscountCap,
} from "../controllers/discountEvent";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

// Cashier/Manager (and Admin, for spot-checking a branch): "what's my cap right now"
router.get(
  "/effective-cap",
  authMiddleware,
  allowRoles("cashier", "manager", "admin"),
  getMyEffectiveDiscountCap,
);

// Admin only — manage event windows
router.post("/", authMiddleware, allowRoles("admin"), createDiscountEvent);
router.get("/", authMiddleware, allowRoles("admin"), getDiscountEvents);
router.patch("/:id", authMiddleware, allowRoles("admin"), updateDiscountEvent);
router.delete("/:id", authMiddleware, allowRoles("admin"), deleteDiscountEvent);

export default router;