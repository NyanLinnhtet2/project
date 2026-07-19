import api from "../api/axiosInstance";
import type {
  AllocateStockData,
  TransferRequestData,
  DeductStockPayload,
} from "../types/inventory";

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
