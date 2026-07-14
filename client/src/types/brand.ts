export interface Brand {
  _id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandData {
  name: string;
  description?: string;
  status?: "active" | "inactive";
}

export interface UpdateBrandData {
  name?: string;
  description?: string;
  status?: "active" | "inactive";
}

export interface BrandStats {
  total: number;
  active: number;
  inactive: number;
}
