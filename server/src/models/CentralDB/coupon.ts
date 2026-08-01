import { Schema, Document, Model, Types } from "mongoose";
import { centralDBConnection } from "../../db/db";

export type CouponType = "level_up" | "birthday";
export type CouponStatus = "active" | "used" | "expired";

export interface ICoupon extends Document {
  code: string; // unique, human-readable — e.g. "GOLD-8F3K2Q"
  customerId: Types.ObjectId;
  customerName: string; // denormalized for admin/manager listing without a join
  type: CouponType;
  discountType: "amount" | "percent";
  discountValue: number;
  status: CouponStatus;
  expiresAt: Date;
  usedInSaleId?: Types.ObjectId;
  usedAt?: Date;
  emailSentAt?: Date; // set once the birthday/level-up notification email actually goes out
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, required: true, ref: "Customer" },
    customerName: { type: String, required: true },
    type: { type: String, enum: ["level_up", "birthday"], required: true },
    discountType: { type: String, enum: ["amount", "percent"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["active", "used", "expired"], default: "active" },
    expiresAt: { type: Date, required: true },
    usedInSaleId: { type: Schema.Types.ObjectId },
    usedAt: { type: Date },
    emailSentAt: { type: Date },
  },
  { timestamps: true },
);

couponSchema.index({ customerId: 1, status: 1 });

export const getCentralCouponModel = (): Model<ICoupon> => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }
  return (
    (centralDBConnection.models.Coupon as Model<ICoupon>) ||
    centralDBConnection.model<ICoupon>("Coupon", couponSchema)
  );
};