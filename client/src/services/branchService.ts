import axios from "axios";
import type {
  CreateBranchData,
  GetBranchesParams,
  UpdateBranchData,
} from "../types/branch";

const API_URL = import.meta.env.VITE_API_URL;

axios.defaults.withCredentials = true;

export const createBranchApi = async (branchData: CreateBranchData) => {
  const { data } = await axios.post(
    `${API_URL}/branches/create-branch`,
    branchData,
  );
  return data;
};

export const getBranchesApi = async () => {
  const { data } = await axios.get(`${API_URL}/branches`);
  return data;
};

export const updateBranchApi = async (
  id: string,
  branchData: UpdateBranchData,
) => {
  const { data } = await axios.put(
    `${API_URL}/branches/update-branch/${id}`,
    branchData,
  );
  return data;
};

export const getBranchesWithParamsApi = async (params: GetBranchesParams) => {
  const { data } = await axios.get(`${API_URL}/branches`, { params });
  return data;
};

export const getBranchByIdApi = async (id: string) => {
  const { data } = await axios.get(`${API_URL}/branches/${id}`);
  return data;
};

// Branch ကို ဖျက်ရန် API
export const deleteBranchApi = async (id: string) => {
  const { data } = await axios.delete(`${API_URL}/branches/${id}`);
  return data;
};
