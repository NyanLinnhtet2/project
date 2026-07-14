import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

axios.defaults.withCredentials = true;

export const getBrandsApi = async (params?: any) => {
  const { data } = await axios.get(`${API_URL}/brands`, { params });
  return data;
};

export const getBrandByIdApi = async (id: string) => {
  const { data } = await axios.get(`${API_URL}/brands/${id}`);
  return data;
};

export const createBrandApi = async (brandData: any) => {
  const { data } = await axios.post(`${API_URL}/brands/create`, brandData);
  return data;
};

export const updateBrandApi = async (id: string, brandData: any) => {
  const { data } = await axios.put(`${API_URL}/brands/${id}`, brandData);
  return data;
};

export const deleteBrandApi = async (id: string) => {
  const { data } = await axios.delete(`${API_URL}/brands/${id}`);
  return data;
};

export const getBrandStatsApi = async () => {
  const { data } = await axios.get(`${API_URL}/brands/stats`);
  return data;
};

export const getBrandsWithCountApi = async (params?: any) => {
  const { data } = await axios.get(`${API_URL}/brands/with-count`, { params });
  return data;
};
