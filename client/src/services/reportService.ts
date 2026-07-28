import api from "../api/axiosInstance";
import type { GetReportSummaryParams } from "../types/report";

export const getReportSummaryApi = async (params?: GetReportSummaryParams) => {
  const response = await api.get("/reports/summary", { params });
  return response.data;
  
};