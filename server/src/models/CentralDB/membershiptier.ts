import { Schema, Document, Model } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface IMembershipTier extends Document {
  name: string; // "Bronze", "Silver", "Gold", "Platinum"...
  minPurchaseCount: number; // reaching this many completed purchases unlocks the tier
  order: number; // ascending — used to sort tiers and find "the next tier up"
  couponDiscountType: "amount" | "percent";
  couponDiscountValue: number;
  couponValidDays: number; // how many days a level-up coupon from this tier stays usable
  createdAt: Date;
  updatedAt: Date;
}

const membershipTierSchema = new Schema<IMembershipTier>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    minPurchaseCount: { type: Number, required: true, min: 0 },
    order: { type: Number, required: true },
    couponDiscountType: { type: String, enum: ["amount", "percent"], default: "percent" },
    couponDiscountValue: { type: Number, required: true, min: 0 },
    couponValidDays: { type: Number, default: 30 },
  },
  { timestamps: true },
);

membershipTierSchema.index({ order: 1 });

export const getCentralMembershipTierModel = (): Model<IMembershipTier> => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }
  return (
    (centralDBConnection.models.MembershipTier as Model<IMembershipTier>) ||
    centralDBConnection.model<IMembershipTier>("MembershipTier", membershipTierSchema)
  );
};