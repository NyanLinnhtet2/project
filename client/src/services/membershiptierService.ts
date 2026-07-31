import api from "../api/axiosInstance";
import type {
  CreateMembershipTierPayload,
  UpdateMembershipTierPayload,
} from "../types/membershiptier";

// Anyone authenticated can view the ladder
export const getMembershipTiersApi = async () => {
  const response = await api.get("/membership-tiers");
  return response.data;
};

// Admin only
export const createMembershipTierApi = async (
  data: CreateMembershipTierPayload,
) => {
  const response = await api.post("/membership-tiers", data);
  return response.data;
};

export const updateMembershipTierApi = async (
  id: string,
  data: UpdateMembershipTierPayload,
) => {
  const response = await api.patch(`/membership-tiers/${id}`, data);
  return response.data;
};

export const deleteMembershipTierApi = async (id: string) => {
  const response = await api.delete(`/membership-tiers/${id}`);
  return response.data;
};
