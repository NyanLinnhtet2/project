import { getCentralMembershipTierModel } from "../models/CentralDB/membershiptier";
import { getCentralCouponModel, ICoupon } from "../models/CentralDB/coupon";
import { getCentralCustomerModel } from "../models/CentralDB/customer";

const generateCouponCode = (prefix: string): string => {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${random}`;
};

// Call after a sale completes for a known customer. Increments their
// purchase count/spend, and — if the new count crosses a tier threshold —
// upgrades their membership level and issues a level-up coupon.
export const recordCustomerPurchase = async (
  customerId: string,
  saleTotal: number,
): Promise<void> => {
  const Customer = getCentralCustomerModel();
  const customer = await Customer.findById(customerId);
  if (!customer) return;

  customer.purchaseCount += 1;
  customer.totalSpent += saleTotal;

  const MembershipTier = getCentralMembershipTierModel();
  const tiers = await MembershipTier.find().sort({ order: 1 });

  // the highest tier whose threshold the customer now meets
  let newTierName: string | null = null;
  let newTierDiscountType: "amount" | "percent" = "percent";
  let newTierDiscountValue = 0;
  let newTierValidDays = 30;
  for (const tier of tiers) {
    if (customer.purchaseCount >= tier.minPurchaseCount) {
      newTierName = tier.name;
      newTierDiscountType = tier.couponDiscountType;
      newTierDiscountValue = tier.couponDiscountValue;
      newTierValidDays = tier.couponValidDays;
    }
  }

  const leveledUp =
    newTierName !== null && newTierName !== customer.membershipLevel;
  if (leveledUp && newTierName) {
    customer.membershipLevel = newTierName;
  }
  await customer.save();

  if (leveledUp && newTierName) {
    const Coupon = getCentralCouponModel();
    await Coupon.create({
      code: generateCouponCode(newTierName.toUpperCase()),
      customerId: customer._id,
      customerName: customer.name,
      type: "level_up",
      discountType: newTierDiscountType,
      discountValue: newTierDiscountValue,
      status: "active",
      expiresAt: new Date(Date.now() + newTierValidDays * 24 * 60 * 60 * 1000),
    });
  }
};

export type CouponValidationResult =
  | { ok: true; coupon: ICoupon }
  | { ok: false; message: string };

// Validates a coupon code against a specific customer at checkout. Does
// NOT mark it used — that happens once the sale actually completes.
export const validateCoupon = async (
  code: string,
  customerId: string,
): Promise<CouponValidationResult> => {
  const Coupon = getCentralCouponModel();
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon) return { ok: false, message: "Coupon not found" };
  if (coupon.customerId.toString() !== customerId) {
    return {
      ok: false,
      message: "This coupon belongs to a different customer",
    };
  }
  if (coupon.status !== "active") {
    return { ok: false, message: `Coupon already ${coupon.status}` };
  }
  if (coupon.expiresAt < new Date()) {
    coupon.status = "expired";
    await coupon.save();
    return { ok: false, message: "Coupon has expired" };
  }
  return { ok: true, coupon };
};
