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
