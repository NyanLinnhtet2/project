// src/types/product.ts
export interface Product {
  _id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  brand: string;
  branch: string;
  images: {
    url: string;
    public_id: string;
  }[];
  status: "active" | "inactive" | "out-of-stock";
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  brand: string;
  branch: string;
  status: "active" | "inactive" | "out-of-stock";
  images?: string[]; // base64 images
}

export interface UpdateProductData {
  name?: string;
  sku?: string;
  description?: string;
  price?: number;
  cost?: number;
  stock?: number;
  category?: string;
  brand?: string;
  branch?: string;
  status?: "active" | "inactive" | "out-of-stock";
  images?: string[];
}

export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  outOfStock: number;
  totalValue: number;
  categories: Array<{
    _id: string;
    count: number;
  }>;
}
