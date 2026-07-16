export interface ProductVariant {
  size?: string;
  color?: string;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  shopName: string;
  price: number;
  cost: number;
  unit: string;
  status: "active" | "inactive";
  image: {
    url: string;
    public_id: string;
  };
  description: string;
  variants: ProductVariant[];
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
  unit: string;
  status?: "active" | "inactive";
  description?: string;
  avatar?: string;
  variants?: ProductVariant[];
}

export interface UpdateProductData {
  name?: string;
  sku?: string;
  category?: string;
  brand?: string;
  shopName?: string;
  price?: number;
  cost?: number;
  unit?: string;
  status?: "active" | "inactive";
  description?: string;
  avatar?: string;
  variants?: ProductVariant[];
}

export interface CategoryWithCount {
  _id: string;
  name: string;
  status: string;
  productCount: number;
}

export interface BrandWithCount {
  _id: string;
  name: string;
  status: string;
  productCount: number;
}