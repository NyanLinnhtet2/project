import api from "../api/axiosInstance";
import type {
  AllocateStockData,
  TransferRequestData,
  DeductStockPayload,
  StockEditRequestPayload
} from "../types/inventory";


export const requestStockEditApi = async (data: StockEditRequestPayload) => {
  const response = await api.post("/inventory/stock-edit-request", data);
  return response.data;
};

export const getStockEditRequestsApi = async (params?: {
  branchId?: string;
  status?: string;
}) => {
  const response = await api.get("/inventory/stock-edit-requests", { params });
  return response.data;
};

export const approveStockEditRequestApi = async (
  id: string,
  reviewedBy: string,
  adminNote?: string,
) => {
  const response = await api.post(`/inventory/stock-edit-request/${id}/approve`, {
    reviewedBy,
    adminNote,
  });
  return response.data;
};

export const rejectStockEditRequestApi = async (
  id: string,
  reviewedBy: string,
  adminNote?: string,
) => {
  const response = await api.post(`/inventory/stock-edit-request/${id}/reject`, {
    reviewedBy,
    adminNote,
  });
  return response.data;
};

export const allocateStockApi = async (data: AllocateStockData) => {
  const response = await api.post(`/inventory/allocate`, data);
  return response.data;
};

export const getBranchInventoryApi = async (branchId: string) => {
  const response = await api.get(`/inventory/branch/${branchId}`);
  return response.data;
};

export const requestTransferApi = async (data: TransferRequestData) => {
  const response = await api.post(`/inventory/transfer`, data);
  return response.data;
};

export const getStockTransactionsApi = async (branchId: string) => {
  const response = await api.get(`/inventory/transactions`, {
    params: branchId ? { branchId } : {},
  });
  return response.data;
};

export const deductBranchStockApi = async (data: DeductStockPayload) => {
  const response = await api.post("/inventory/delete", data);
  return response.data;
};
