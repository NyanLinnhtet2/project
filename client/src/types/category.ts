export interface Category {
  _id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
  productCount?: number; 
  updatedAt: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  status?: "active" | "inactive";
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  status?: "active" | "inactive";
}

export interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
}