import api from "../api/axiosInstance";
import type {
  CreateReturnPayload,
  GetReturnsOverviewParams,
} from "../types/return";

export const createReturnApi = async (data: CreateReturnPayload) => {
  const response = await api.post("/returns", data);
  return response.data;
};

export const getBranchReturnsApi = async (branchId?: string) => {
  const response = await api.get("/returns", {
    params: branchId ? { branchId } : {},
  });
  return response.data;
};

// Admin: cross-branch, filterable
export const getReturnsOverviewApi = async (
  params?: GetReturnsOverviewParams,
) => {
  const response = await api.get("/returns/overview", { params });
  return response.data;
};

// Manager/Admin: full detail with line items
export const getReturnDetailApi = async (id: string, branchId?: string) => {
  const response = await api.get(`/returns/${id}`, {
    params: branchId ? { branchId } : {},
  });
  return response.data;
};