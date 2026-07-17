import type { Branch } from "./branch";
import type { Product } from "./product";

export interface BranchStockInfo {
  branchId: string;
  branchName: string;
  branchCode: string;
  quantity: number;
  status: string;
}

export interface TransferRecord {
  _id: string;
  fromBranchId: Partial<Branch>;
  toBranchId: Partial<Branch>;
  productId: Partial<Product>;
  quantity: number;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  approvedBy?: string;
  createdAt: string;
}
