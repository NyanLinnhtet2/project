import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

axios.defaults.withCredentials = true;

export const getCategoriesApi = async (params?: any) => {
  const { data } = await axios.get(`${API_URL}/categories`, { params });
  return data;
};

export const getCategoryByIdApi = async (id: string) => {
  const { data } = await axios.get(`${API_URL}/categories/${id}`);
  return data;
};

export const createCategoryApi = async (categoryData: any) => {
  const { data } = await axios.post(
    `${API_URL}/categories/create`,
    categoryData,
  );
  return data;
};

export const updateCategoryApi = async (id: string, categoryData: any) => {
  const { data } = await axios.put(`${API_URL}/categories/${id}`, categoryData);
  return data;
};

export const deleteCategoryApi = async (id: string) => {
  const { data } = await axios.delete(`${API_URL}/categories/${id}`);
  return data;
};

export const getCategoryStatsApi = async () => {
  const { data } = await axios.get(`${API_URL}/categories/stats`);
  return data;
};

export const getCategoriesWithCountApi = async (params?: any) => {
  const { data } = await axios.get(`${API_URL}/categories/with-count`, {
    params,
  });
  return data;
};
