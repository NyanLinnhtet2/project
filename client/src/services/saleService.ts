import api from "../api/axiosInstance";
import type {
  CreateSalePayload,
  GetBranchSalesParams,
  GetSalesOverviewParams,
} from "../types/sale";

// Cashier (or Manager) checks out a cart
export const createSaleApi = async (data: CreateSalePayload) => {
  const response = await api.post("/sales", data);
  return response.data;
};

// Cashier: only their own sales, own branch
export const getMySalesApi = async () => {
  const response = await api.get("/sales/mine");
  return response.data;
};

// Manager: every sale in their own branch.
// Admin: pass { branchId } to inspect one branch.
export const getBranchSalesApi = async (params?: GetBranchSalesParams) => {
  const response = await api.get("/sales/branch", { params });
  return response.data;
};

// Admin: cross-branch overview, filterable by branch + date range
export const getSalesOverviewApi = async (params?: GetSalesOverviewParams) => {
  const response = await api.get("/sales/overview", { params });
  return response.data;
};

// Manager/Admin: void a sale and restock its items
export const voidSaleApi = async (id: string, reason?: string, branchId?: string) => {
  const response = await api.post(`/sales/${id}/void`, { reason, branchId });
  return response.data;
};