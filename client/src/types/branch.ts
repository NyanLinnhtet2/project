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

export interface GetBranchesParams {
  status?: string;
  search?: string;
}
