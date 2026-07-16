import api from "../api/axiosInstance";
import type {
  CreateBranchData,
  GetBranchesParams,
  UpdateBranchData,
} from "../types/branch";

export const createBranchApi = async (branchData: CreateBranchData) => {
  const { data } = await api.post(`/branches/create-branch`, branchData);
  return data;
};

export const getBranchesApi = async () => {
  const { data } = await api.get(`/branches`);
  return data;
};

export const updateBranchApi = async (
  id: string,
  branchData: UpdateBranchData,
) => {
  const { data } = await api.put(`/branches/update-branch/${id}`, branchData);
  return data;
};

export const getBranchesWithParamsApi = async (params: GetBranchesParams) => {
  const { data } = await api.get(`/branches`, { params });
  return data;
};

export const getBranchByIdApi = async (id: string) => {
  const { data } = await api.get(`/branches/${id}`);
  return data;
};

export const deleteBranchApi = async (id: string) => {
  const { data } = await api.delete(`/branches/${id}`);
  return data;
};

export const getBranchesForDropdownApi = async () => {
  const { data } = await api.get(`/branches/dropdown`);
  return data;
};
