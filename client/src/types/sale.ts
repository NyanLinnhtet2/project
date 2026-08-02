import type { Product } from "./product";

export type PaymentMethod = "cash" | "kbz_pay" | "wave_pay" | "card" | "other";
export type SaleStatus = "completed" | "voided";
export type DiscountType = "amount" | "percent";

export interface SaleItem {
  productId: string;
  name: string;
  category?: string;
  brand?: string;
  quantity: number;
  price: number;
}

export interface Sale {
  _id: string;
  saleNumber: string;
  cashierId: string;
  cashierName: string;
  items: SaleItem[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  voidedReason?: string;
  voidedBy?: string;
  voidedByName?: string;
  voidedAt?: string;
  approvedByName?: string; // set when a discount over the normal cap was manager-approved
  linkedReturnId?: string; // set when this sale is the replacement half of an exchange
  linkedReturnNumber?: string; // human-readable code for the above
  customerId?: string; // set when this sale was linked to a known customer
  couponCode?: string; // set when a coupon was redeemed on this sale
  couponDiscountAmount?: number; // Ks amount the coupon took off, on top of the manual discount
  canReturn?: boolean; // only present on getMySales/getBranchSales — whether anything is still returnable
  returnType?: "return" | "exchange"; // only present on the same — set if this sale has had a return processed against it
  createdAt: string;
  updatedAt: string;
}

// what the cashier sends when checking out — backend prices the items
// itself from CentralDB, so only productId + quantity go over the wire
export interface CreateSaleItemPayload {
  productId: string;
  quantity: number;
}

export interface CreateSalePayload {
  items: CreateSaleItemPayload[];
  paymentMethod?: PaymentMethod;
  discountType?: DiscountType;
  discountValue?: number; // 10 for 10% or a flat Ks amount, depending on discountType
  taxRate?: number; // percent
  linkedReturnId?: string; // Return _id or returnNumber — marks this sale as the replacement half of an exchange
  customerId?: string; // link this sale to a known customer for purchase tracking
  couponCode?: string; // redeem a coupon issued to that customer (requires customerId)
}

export interface SaleSummary {
  _id: string;
  branchId: string;
  branchName: string;
  saleId: string;
  saleNumber: string;
  cashierId: string;
  cashierName: string;
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  createdAt: string;
}

export interface BranchSalesBreakdown {
  branchName: string;
  total: number;
  count: number;
}

export interface GetBranchSalesParams {
  branchId?: string; // admin only — manager/cashier are scoped server-side
  cashierId?: string;
  status?: SaleStatus;
}

export interface GetSalesOverviewParams {
  branchId?: string;
  startDate?: string; // ISO date
  endDate?: string;
}

// Cart line while the cashier is still building the sale, before checkout —
// carries the product so the UI can show name/price/stock without refetching
export interface CartLine {
  product: Product;
  quantity: number;
}