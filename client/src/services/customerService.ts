import api from "../api/axiosInstance";
import type {
  CreateCustomerPayload,
  UpdateCustomerPayload,
} from "../types/customer";

// Cashier/Manager/Admin registers a new customer
export const createCustomerApi = async (data: CreateCustomerPayload) => {
  const response = await api.post("/customers", data);
  return response.data;
};

// Cashier/Manager/Admin looks up a customer by phone or name (checkout search)
export const searchCustomersApi = async (q: string) => {
  const response = await api.get("/customers/search", { params: { q } });
  return response.data;
};

// Manager/Admin: paginated list
export const listCustomersApi = async (page = 1) => {
  const response = await api.get("/customers", { params: { page } });
  return response.data;
};

// Active, unexpired coupons for this customer — used at checkout to
// surface a birthday/level-up coupon even if they never got the email
export const getActiveCouponsApi = async (id: string) => {
  const response = await api.get(`/customers/${id}/active-coupons`);
  return response.data;
};

// Admin only — manually issues/resends the birthday coupon email
export const sendBirthdayEmailApi = async (id: string) => {
  const response = await api.post(`/customers/${id}/send-birthday-email`);
  return response.data;
};

// Full profile: purchase history, favorite products, coupons, membership progress
export const getCustomerProfileApi = async (id: string) => {
  const response = await api.get(`/customers/${id}`);
  return response.data;
};

// Manager/Admin edits customer info
export const updateCustomerApi = async (
  id: string,
  data: UpdateCustomerPayload,
) => {
  const response = await api.patch(`/customers/${id}`, data);
  return response.data;
};