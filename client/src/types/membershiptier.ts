export interface MembershipTier {
  _id: string;
  name: string;
  minPurchaseCount: number;
  order: number;
  couponDiscountType: "amount" | "percent";
  couponDiscountValue: number;
  couponValidDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMembershipTierPayload {
  name: string;
  minPurchaseCount: number;
  order: number;
  couponDiscountType?: "amount" | "percent";
  couponDiscountValue: number;
  couponValidDays?: number;
}

export interface UpdateMembershipTierPayload {
  name?: string;
  minPurchaseCount?: number;
  order?: number;
  couponDiscountType?: "amount" | "percent";
  couponDiscountValue?: number;
  couponValidDays?: number;
}