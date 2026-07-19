import type { Product } from "./product";

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