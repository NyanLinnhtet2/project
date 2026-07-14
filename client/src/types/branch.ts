export interface Branch {
  _id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  dbName: string;
  status: "active" | "inactive";

  employeeCount: number;
  revenue: number;
  totalOrders: number;
  lastUpdated?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchData {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  status: "active" | "inactive";
}

export interface UpdateBranchData {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  manager?: string;
  status?: "active" | "inactive";
}

export interface BranchStats {
  total: number;
  active: number;
  inactive: number;
  branches: Array<{
    name: string;
    code: string;
    status: string;
    manager: string;
    employeeCount: number;
  }>;
}

export interface BranchSummary {
  total: number;
  active: number;
  inactive: number;
  totalEmployees: number;
  totalRevenue: number;
  totalOrders: number;
  branches: Branch[];
}

export interface GetBranchesParams {
  status?: string;
  search?: string;
}
