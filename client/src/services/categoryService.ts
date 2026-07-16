import api from "../api/axiosInstance";

export const getCategoriesApi = async (params?: any) => {
  const { data } = await api.get(`/categories`, { params });
  return data;
};

export const getCategoryByIdApi = async (id: string) => {
  const { data } = await api.get(`/categories/${id}`);
  return data;
};

export const createCategoryApi = async (categoryData: any) => {
  const { data } = await api.post(`/categories/create`, categoryData);
  return data;
};

export const updateCategoryApi = async (id: string, categoryData: any) => {
  const { data } = await api.put(`/categories/${id}`, categoryData);
  return data;
};

export const deleteCategoryApi = async (id: string) => {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
};

export const getCategoryStatsApi = async () => {
  const { data } = await api.get(`/categories/stats`);
  return data;
};

export const getCategoriesWithCountApi = async (params?: any) => {
  const { data } = await api.get(`/categories/with-count`, {
    params,
  });
  return data;
};
