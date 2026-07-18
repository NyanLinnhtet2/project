import type { Branch } from "./branch";
import type { Product } from "./product";
export interface TransferRequestPayload {
  fromBranch: string;
  toBranch: string;
  productId: string;
  quantity: number;
  requestedBy: string;
}

export interface BranchStockInfo {
  branchName: string;
  branchId?: string;
  branchCode?: string;
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
