import api from "../api/axiosInstance";

export const getDashboardOverviewApi = async (branchId?: string) => {
  const response = await api.get("/dashboard/overview", {
    params: branchId ? { branchId } : undefined,
  });
  return response.data;
};
