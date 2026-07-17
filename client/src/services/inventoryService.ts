import api from "../api/axiosInstance"
import type { AllocateStockData, TransferRequestData } from "../types/inventory";

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