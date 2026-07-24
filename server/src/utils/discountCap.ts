import { Types } from "mongoose";
import { getCentralDiscountEventModel } from "../models/CentralDB/discountEvent";

export const STATIC_DISCOUNT_CAP_PERCENT: Record<string, number> = {
  cashier: 10,
  manager: 30,
};

interface EffectiveCapResult {
  capPercent: number;
  source: "static" | "event";
  eventName?: string;
}

export const getEffectiveDiscountCap = async (
  role: string,
  branchId: Types.ObjectId,
): Promise<EffectiveCapResult> => {
  const staticCap = STATIC_DISCOUNT_CAP_PERCENT[role];

  const DiscountEvent = getCentralDiscountEventModel();
  const now = new Date();

  const activeEvent = await DiscountEvent.findOne({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [{ scope: "all" }, { scope: "branch", branchIds: branchId }],
  }).sort({ createdAt: -1 }); // if more than one overlaps, the newest wins

  if (!activeEvent) {
    return { capPercent: staticCap ?? 0, source: "static" };
  }

  const eventCap =
    role === "manager" ? activeEvent.managerCap : activeEvent.cashierCap;

  return {
    capPercent: eventCap,
    source: "event",
    eventName: activeEvent.name,
  };
};
