import api from "../api/axiosInstance";
import type { CreateApprovalRequestPayload } from "../types/discountApprovalRequest";

// Cashier/Manager
export const createDiscountApprovalRequestApi = async (
  data: CreateApprovalRequestPayload,
) => {
  const response = await api.post("/discount-approval-requests", data);
  return response.data;
};

export const getMyLatestApprovalRequestApi = async () => {
  const response = await api.get("/discount-approval-requests/mine");
  return response.data;
};

export const cancelApprovalRequestApi = async (id: string) => {
  const response = await api.post(`/discount-approval-requests/${id}/cancel`);
  return response.data;
};

// Manager/Admin
export const getPendingApprovalsApi = async () => {
  const response = await api.get("/discount-approval-requests/pending");
  return response.data;
};

export const approveApprovalRequestApi = async (id: string) => {
  const response = await api.post(`/discount-approval-requests/${id}/approve`);
  return response.data;
};

export const rejectApprovalRequestApi = async (id: string, reason?: string) => {
  const response = await api.post(`/discount-approval-requests/${id}/reject`, {
    reason,
  });
  return response.data;
};