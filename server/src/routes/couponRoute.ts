import express from "express";
import { checkCoupon } from "../controllers/coupon";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.get(
  "/validate",
  authMiddleware,
  allowRoles("cashier", "manager", "admin"),
  checkCoupon,
);

export default router;
