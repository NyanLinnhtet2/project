export type ReturnType = "return" | "exchange";

export interface ReturnItem {
  productId: string;
  name: string;
  category?: string;
  brand?: string;
  quantity: number;
  price: number; // original sale's per-unit price
  refundAmount: number; // this line's prorated refund
}

export interface ReturnRecord {
  _id: string;
  returnNumber: string;
  originalSaleId: string;
  originalSaleNumber: string;
  cashierId: string;
  cashierName: string;
  processedBy: string;
  processedByName: string;
  items: ReturnItem[];
  refundAmount: number;
  reason: string;
  type: ReturnType;
  exchangeSaleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnSummary {
  _id: string;
  branchId: string;
  branchName: string;
  returnId: string;
  returnNumber: string;
  originalSaleId: string;
  originalSaleNumber: string;
  itemCount: number;
  refundAmount: number;
  type: ReturnType;
  processedBy: string;
  processedByName: string;
  createdAt: string;
}

export interface ReturnBranchBreakdown {
  branchName: string;
  total: number;
  count: number;
}

export interface GetReturnsOverviewParams {
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateReturnPayload {
  originalSaleId: string;
  items: { productId: string; quantity: number }[];
  reason?: string;
  type?: ReturnType;
  branchId?: string; // admin only
}