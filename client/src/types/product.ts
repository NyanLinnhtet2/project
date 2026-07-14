export interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  shopName: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  status: "active" | "inactive" | "out-of-stock";
  image: {
    url: string;
    public_id: string;
  };
  description: string;
  branch: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  sku: string;
  category: string;
  brand: string;
  shopName?: string;
  price: number;
  cost?: number;
  stock: number;
  unit: string;
  status?: "active" | "inactive" | "out-of-stock";
  description?: string;
  branch: string;
  avatar?: string;
}

export interface UpdateProductData {
  name?: string;
  sku?: string;
  category?: string;
  brand?: string;
  shopName?: string;
  price?: number;
  cost?: number;
  stock?: number;
  unit?: string;
  status?: "active" | "inactive" | "out-of-stock";
  description?: string;
  branch?: string;
  avatar?: string;
}
