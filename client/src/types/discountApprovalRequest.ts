export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled";

export type ApproverLevel = "manager" | "admin";

export interface ApprovalRequestItem {
  productId: string;
  name: string;
  category?: string;
  brand?: string;
  quantity: number;
  price: number;
}

export interface DiscountApprovalRequest {
  _id: string;
  branchId: string;
  branchName: string;
  cashierId: string;
  cashierName: string;
  cashierRole: "cashier" | "manager";
  items: ApprovalRequestItem[];
  subtotal: number;
  discountType: "amount" | "percent";
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  requiredApproverLevel: ApproverLevel;
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewNote?: string;
  resultingSaleId?: string;
  customerId?: string;
  customerName?: string;
  couponCode?: string;
  couponDiscountAmount?: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApprovalRequestPayload {
  items: { productId: string; quantity: number }[];
  paymentMethod?: string;
  discountType?: "amount" | "percent";
  discountValue?: number;
  taxRate?: number;
  customerId?: string;
  couponCode?: string;
}