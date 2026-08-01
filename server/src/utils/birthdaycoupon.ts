import mongoose from "mongoose";
import { getCentralCouponModel, ICoupon } from "../models/CentralDB/coupon";
import { generateCouponCode } from "./membership";
import { sendEmail } from "./mailer";

interface CustomerLike {
  _id: mongoose.Types.ObjectId | string;
  name: string;
  email?: string;
  dateOfBirth?: Date | string;
}

// Resolved fresh each call rather than cached, so an env change takes
// effect on the very next send without a server restart.
export const getBirthdayCouponConfig = () => {
  const discountType: "amount" | "percent" =
    process.env.BIRTHDAY_COUPON_DISCOUNT_TYPE === "amount" ? "amount" : "percent";
  const discountValue = Number(process.env.BIRTHDAY_COUPON_DISCOUNT_VALUE) || 15;
  const validDays = Number(process.env.BIRTHDAY_COUPON_VALID_DAYS) || 14;
  return { discountType, discountValue, validDays };
};

export const isBirthdayToday = (dateOfBirth?: Date | string): boolean => {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  return dob.getMonth() === now.getMonth() && dob.getDate() === now.getDate();
};

const buildBirthdayEmailHtml = (
  customerName: string,
  code: string,
  discountType: "amount" | "percent",
  discountValue: number,
  expiresAt: Date,
): string => {
  const discountLabel =
    discountType === "percent" ? `${discountValue}% off` : `${discountValue.toLocaleString()} Ks off`;
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>🎂 Happy Birthday, ${customerName}!</h2>
      <p>To celebrate, here's a birthday gift from us — <strong>${discountLabel}</strong> your next purchase.</p>
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:16px; text-align:center; margin:20px 0;">
        <p style="margin:0; font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:0.05em;">Your Coupon Code</p>
        <p style="margin:8px 0 0; font-size:24px; font-weight:bold; letter-spacing:0.1em; color:#059669;">${code}</p>
      </div>
      <p style="color:#64748b; font-size:13px;">Valid until ${expiresAt.toLocaleDateString()}. Show this code to the cashier at checkout.</p>
      <p>Thank you for being a valued customer — we hope to see you soon!</p>
    </div>
  `;
};

// One birthday coupon per customer per calendar year — if the cron (or an
// earlier manual send) already issued one this year, reuse it instead of
// creating a second, so "Send Birthday Email" is always safe to click again
// (e.g. to resend after fixing the customer's email).
export const getOrCreateBirthdayCoupon = async (
  customer: CustomerLike,
): Promise<ICoupon> => {
  const Coupon = getCentralCouponModel();
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const existing = await Coupon.findOne({
    customerId: customer._id,
    type: "birthday",
    createdAt: { $gte: startOfYear },
  });
  if (existing) return existing;

  const { discountType, discountValue, validDays } = getBirthdayCouponConfig();
  const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

  return Coupon.create({
    code: generateCouponCode("BDAY"),
    customerId: customer._id,
    customerName: customer.name,
    type: "birthday",
    discountType,
    discountValue,
    status: "active",
    expiresAt,
  });
};

// Returns false (without throwing) when the customer has no email on file —
// callers should surface that as a normal "can't send" outcome, not an error.
export const sendBirthdayCouponEmail = async (
  customer: CustomerLike,
  coupon: ICoupon,
): Promise<boolean> => {
  if (!customer.email) return false;
  const sent = await sendEmail(
    customer.email,
    "🎂 Happy Birthday — here's a gift from us!",
    buildBirthdayEmailHtml(
      customer.name,
      coupon.code,
      coupon.discountType,
      coupon.discountValue,
      coupon.expiresAt,
    ),
  );
  if (sent) {
    coupon.emailSentAt = new Date();
    await coupon.save();
  }
  return sent;
};