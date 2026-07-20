import type { Product } from "./product";
import type { Branch } from "./branch";

export interface Stock {
  _id: string;
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  lastUpdated: string;
  product?: Partial<Product>;
}

export interface AllocateStockData {
  branchId: string;
  productId: string;
  quantity: number;
}

export interface TransferRequestData {
  fromBranchId: string;
  toBranchId: string;
  productId: string;
  quantity: number;
  requestedBy: string;
}
export interface StockTransaction {
  _id: string;
  productId: string | Product;
  branchId: string;
  transactionType: "INBOUND" | "OUTBOUND" | "ADJUSTMENT";
  quantity: number;
  performedBy: string;
  createdAt: string;
}

export interface DeductStockPayload {
  branchId: string;
  productId: string;
  quantity: number;
  performedBy: string;
  notes: string;
  transactionType: "OUTBOUND" | "DAMAGE" | "ADJUSTMENT";
}

export interface StockEditRequest {
  _id: string;
  branchId: string | Branch;
  productId: string | Product;
  currentQuantity: number;
  requestedQuantity: number;
  changeAmount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNote?: string;
  createdAt: string;
}

export interface StockEditRequestPayload {
  branchId: string;
  productId: string;
  requestedQuantity: number;
  reason: string;
  requestedBy: string;
}
