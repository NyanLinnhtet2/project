import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { validateCoupon } from "../utils/membership";

const isValidObjectId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

// ============================================================
// GET /api/coupons/validate?code=&customerId= — Cashier/Manager checks a
// coupon code against the selected customer *before* checkout, so the UI
// can show the discount live instead of only failing at createSale time.
// Does NOT mark the coupon used — createSale does that once the sale commits.
// ============================================================
export const checkCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const code = (req.query.code as string) || "";
    const customerId = (req.query.customerId as string) || "";

    if (!code.trim() || !customerId.trim()) {
      return res.status(400).json({
        success: false,
        message: "code and customerId are required",
      });
    }
    if (!isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    const result = await validateCoupon(code, customerId);
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, data: result.coupon });
  } catch (error: any) {
    console.error("❌ Check Coupon Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};