import api from "../api/axiosInstance";
import type {
  CreateDiscountEventPayload,
  UpdateDiscountEventPayload,
} from "../types/discountEvent";

// Cashier/Manager (and Admin): "what's my discount limit right now"
export const getEffectiveDiscountCapApi = async () => {
  const response = await api.get("/discount-events/effective-cap");
  return response.data;
};

// Admin only — event window management
export const createDiscountEventApi = async (
  data: CreateDiscountEventPayload,
) => {
  const response = await api.post("/discount-events", data);
  return response.data;
};

export const getDiscountEventsApi = async () => {
  const response = await api.get("/discount-events");
  return response.data;
};

export const updateDiscountEventApi = async (
  id: string,
  data: UpdateDiscountEventPayload,
) => {
  const response = await api.patch(`/discount-events/${id}`, data);
  return response.data;
};

export const deleteDiscountEventApi = async (id: string) => {
  const response = await api.delete(`/discount-events/${id}`);
  return response.data;
};