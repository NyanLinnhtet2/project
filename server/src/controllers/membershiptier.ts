import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { getCentralMembershipTierModel } from "../models/CentralDB/membershiptier";

// ============================================================
// POST /api/membership-tiers — Admin only
// ============================================================
export const createMembershipTier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      minPurchaseCount,
      order,
      couponDiscountType,
      couponDiscountValue,
      couponValidDays,
    } = req.body as {
      name: string;
      minPurchaseCount: number;
      order: number;
      couponDiscountType?: "amount" | "percent";
      couponDiscountValue: number;
      couponValidDays?: number;
    };

    if (!name || minPurchaseCount == null || order == null || couponDiscountValue == null) {
      return res.status(400).json({
        success: false,
        message: "name, minPurchaseCount, order and couponDiscountValue are required",
      });
    }

    const MembershipTier = getCentralMembershipTierModel();
    const tier = await MembershipTier.create({
      name: name.trim(),
      minPurchaseCount,
      order,
      couponDiscountType: couponDiscountType === "amount" ? "amount" : "percent",
      couponDiscountValue,
      couponValidDays: couponValidDays ?? 30,
    });

    return res.status(201).json({ success: true, data: tier });
  } catch (error: any) {
    console.error("❌ Create Membership Tier Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET /api/membership-tiers — anyone authenticated can view the ladder
// ============================================================
export const getMembershipTiers = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const MembershipTier = getCentralMembershipTierModel();
    const tiers = await MembershipTier.find().sort({ order: 1 });
    return res.status(200).json({ success: true, data: tiers });
  } catch (error: any) {
    console.error("❌ Get Membership Tiers Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// PATCH /api/membership-tiers/:id — Admin only
// ============================================================
export const updateMembershipTier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      "name",
      "minPurchaseCount",
      "order",
      "couponDiscountType",
      "couponDiscountValue",
      "couponValidDays",
    ] as const;
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in req.body) updates[field] = req.body[field];
    }

    const MembershipTier = getCentralMembershipTierModel();
    const tier = await MembershipTier.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!tier) {
      return res.status(404).json({ success: false, message: "Tier not found" });
    }

    return res.status(200).json({ success: true, data: tier });
  } catch (error: any) {
    console.error("❌ Update Membership Tier Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// DELETE /api/membership-tiers/:id — Admin only
// ============================================================
export const deleteMembershipTier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const MembershipTier = getCentralMembershipTierModel();
    const deleted = await MembershipTier.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Tier not found" });
    }
    return res.status(200).json({ success: true, message: "Tier deleted" });
  } catch (error: any) {
    console.error("❌ Delete Membership Tier Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};