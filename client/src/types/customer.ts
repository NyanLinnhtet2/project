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