import api from "../api/axiosInstance";

// Cashier/Manager: check a coupon code against the selected customer before
// checkout, so the UI can show the discount live. Does NOT redeem it —
// createSaleApi does that once the sale actually commits.
export const validateCouponApi = async (code: string, customerId: string) => {
  const response = await api.get("/coupons/validate", {
    params: { code, customerId },
  });
  return response.data;
};