import Dexie, { type Table } from "dexie";

export interface CachedProduct {
  productId: string; // primary key
  branchId: string;
  stockId: string;
  name: string;
  sku: string;
  price: number;
  category?: string;
  brand?: string;
  imageUrl?: string;
  quantity: number; // last known stock — decremented locally as offline sales are queued
}

export type PendingSaleStatus = "pending" | "syncing" | "failed";

export interface PendingSaleItem {
  productId: string;
  quantity: number;
  name: string; // kept for display in the pending-sync panel without a lookup
}

export interface PendingSale {
  id?: number; // Dexie auto-increment primary key
  branchId: string;
  items: PendingSaleItem[];
  paymentMethod: string;
  discountType: "amount" | "percent";
  discountValue: number;
  taxRate: number;
  status: PendingSaleStatus;
  errorMessage?: string;
  createdAt: string;
}

class OfflineDatabase extends Dexie {
  products!: Table<CachedProduct, string>;
  pendingSales!: Table<PendingSale, number>;

  constructor() {
    super("posOfflineDb");
    this.version(1).stores({
      products: "productId, branchId",
      pendingSales: "++id, status, branchId",
    });
  }
}

export const offlineDb = new OfflineDatabase();