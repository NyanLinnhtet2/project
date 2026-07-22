import type { Product } from "./product";

export type PaymentMethod = "cash" | "kbz_pay" | "wave_pay" | "card" | "other";
export type SaleStatus = "completed" | "voided";
export type DiscountType = "amount" | "percent";

export interface SaleItem {
  productId: string;
  name: string;
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