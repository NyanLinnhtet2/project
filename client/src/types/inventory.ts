// src/types/inventory.ts
export interface Stock {
  _id: string;
  productId: string;
  productSku: string;
  productName: string;
  branch: string;
  quantity: number;
  unit: string;
  variants: Array<{
    size: string;
    color: string;
  }>;
  lastUpdated: string;
  status: "in-stock" | "low-stock" | "out-of-stock";
  createdAt: string;
  updatedAt: string;
}

export interface StockTransaction {
  _id: string;
  productId: string;
  productName: string;
  sku: string;
  branch: string;
  type: "purchase" | "sale" | "return" | "adjustment" | "transfer" | "received";
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  note?: string;
  supplier?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddStockData {
  productId: string;
  quantity: number;
  branch: string;
  note?: string;
  supplier?: string;
}

export interface UpdateStockData {
  productId: string;
  quantity: number;
  branch: string;
  note?: string;
}

export interface TransferStockData {
  productId: string;
  fromBranch: string;
  toBranch: string;
  quantity: number;
  note?: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  branches: {
    name: string;
    productCount: number;
    totalQuantity: number;
    totalValue: number;
  }[];
}

export interface ProductStockSummary {
  productId: string;
  productSku: string;
  productName: string;
  price: number;
  unit: string;
  totalStock: number;
  variants: Array<{
    size: string;
    color: string;
  }>;
  branchStocks: {
    branch: string;
    quantity: number;
  }[];
}