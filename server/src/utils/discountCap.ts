import { Types } from "mongoose";
import { getCentralDiscountEventModel } from "../models/CentralDB/discountEvent";

// Floor/default caps — always apply when no event is currently live for
// this branch. Keep these as the "normal day" numbers; use a DiscountEvent
// (admin-managed, time-bound) to raise them for a promotion instead of
// editing this file and redeploying.
export const STATIC_DISCOUNT_CAP_PERCENT: Record<string, number> = {
  cashier: 10,
  manager: 30,
};

interface EffectiveCapResult {
  capPercent: number;
  source: "static" | "event";
  eventName?: string;
}

// role must be "cashier" | "manager" (admin doesn't ring up sales, so it
// isn't given a cap here — callers should short-circuit for admin).
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