import api from "../api/axiosInstance";
import type { TransferRecord, BranchStockInfo } from "../types/transfer";

export const getProductStockAcrossBranchesApi = async (productId: string) => {
  const response = await api.get<{ success: boolean; data: BranchStockInfo[] }>(
    `/transfers/product-stock/${productId}`,
  );
  return response.data;
};

export const createTransferRequestApi = async (payload: {
  fromBranchId: string;
  toBranchId: string;
  productId: string;
  quantity: number;
  requestedBy: string;
}) => {
  const response = await api.post(`/transfers/request`, payload);
  return response.data;
};

export const getTransfersApi = async () => {
  const response = await api.get<{ success: boolean; data: TransferRecord[] }>(
    `/transfers`,
  );
  return response.data;
};

export const approveTransferApi = async (id: string, approvedBy: string) => {
  const response = await api.put(`/transfers/${id}/approve`, { approvedBy });
  return response.data;
};

export const rejectTransferApi = async (id: string, approvedBy: string) => {
  const response = await api.put(`/transfers/${id}/reject`, { approvedBy });
  return response.data;
};
