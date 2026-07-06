// src/services/branchService.ts
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Cookie support
axios.defaults.withCredentials = true;

// Export interfaces
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

export interface BranchStats {
  total: number;
  active: number;
  inactive: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Create new branch
export const createBranch = async (data: CreateBranchData): Promise<ApiResponse<Branch>> => {
  const { data: response } = await axios.post<ApiResponse<Branch>>(
    `${API_URL}/branches/create-branch`,
    data,
    { withCredentials: true }
  );
  return response;
};

// Get all branches
export const getBranches = async (): Promise<ApiResponse<Branch[]>> => {
  const { data: response } = await axios.get<ApiResponse<Branch[]>>(
    `${API_URL}/branches`,
    { withCredentials: true }
  );
  return response;
};

// Get branch by ID
export const getBranchById = async (id: string): Promise<ApiResponse<Branch>> => {
  const { data: response } = await axios.get<ApiResponse<Branch>>(
    `${API_URL}/branches/${id}`,
    { withCredentials: true }
  );
  return response;
};

// Update branch
export const updateBranch = async (
  id: string, 
  data: Partial<CreateBranchData>
): Promise<ApiResponse<Branch>> => {
  const { data: response } = await axios.put<ApiResponse<Branch>>(
    `${API_URL}/branches/${id}`,
    data,
    { withCredentials: true }
  );
  return response;
};

// Delete branch
export const deleteBranch = async (id: string): Promise<ApiResponse<null>> => {
  const { data: response } = await axios.delete<ApiResponse<null>>(
    `${API_URL}/branches/${id}`,
    { withCredentials: true }
  );
  return response;
};

// Get branch stats
export const getBranchStats = async (): Promise<ApiResponse<BranchStats>> => {
  const { data: response } = await axios.get<ApiResponse<BranchStats>>(
    `${API_URL}/branches/stats`,
    { withCredentials: true }
  );
  return response;
};