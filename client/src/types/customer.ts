export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  totalSpent: number;
  purchaseCount: number;
  membershipLevel: string;
  registeredBranch: string;
  // Only present on list/search results — true once this year's birthday
  // coupon has already been redeemed, so the UI can stop flagging "today's
  // the birthday" once there's nothing left to send.
  birthdayCouponUsedThisYear?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string; // ISO date
}

export interface UpdateCustomerPayload {
  name?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
}

export type CouponType = "level_up" | "birthday";
export type CouponStatus = "active" | "used" | "expired";
export type CouponDiscountType = "amount" | "percent";

export interface Coupon {
  _id: string;
  code: string;
  customerId: string;
  customerName: string;
  type: CouponType;
  discountType: CouponDiscountType;
  discountValue: number;
  status: CouponStatus;
  expiresAt: string;
  usedInSaleId?: string;
  usedAt?: string;
  emailSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export interface CustomerProfileData {
  customer: Customer;
  purchaseHistory: {
    _id: string;
    saleNumber: string;
    branchName: string;
    totalAmount: number;
    status: "completed" | "voided";
    createdAt: string;
  }[];
  favoriteProducts: FavoriteProduct[];
  coupons: Coupon[];
  nextTier: { name: string; purchasesNeeded: number } | null;
}