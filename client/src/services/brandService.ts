import api from "../api/axiosInstance";

export const getBrandsApi = async (params?: any) => {
  const { data } = await api.get(`/brands`, { params });
  return data;
};

export const getBrandByIdApi = async (id: string) => {
  const { data } = await api.get(`/brands/${id}`);
  return data;
};

export const createBrandApi = async (brandData: any) => {
  const { data } = await api.post(`/brands/create`, brandData);
  return data;
};

export const updateBrandApi = async (id: string, brandData: any) => {
  const { data } = await api.put(`/brands/${id}`, brandData);
  return data;
};

export const deleteBrandApi = async (id: string) => {
  const { data } = await api.delete(`/brands/${id}`);
  return data;
};

export const getBrandStatsApi = async () => {
  const { data } = await api.get(`/brands/stats`);
  return data;
};

export const getBrandsWithCountApi = async (params?: any) => {
  const { data } = await api.get(`/brands/with-count`, { params });
  return data;
};
