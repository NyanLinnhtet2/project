import api from "../api/axiosInstance";
import type { CreateProductData, UpdateProductData } from "../types/product";

// Get all products
export const getProductsApi = async (params?: any) => {
  const { data } = await api.get(`/products`, { params });
  return data;
};

// Get product by ID
export const getProductByIdApi = async (id: string) => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

// Create product
export const createProductApi = async (productData: CreateProductData) => {
  const { data } = await api.post(`/products/create`, productData);
  return data;
};

// Update product
export const updateProductApi = async (
  id: string,
  productData: UpdateProductData,
) => {
  const { data } = await api.put(`/products/${id}`, productData);
  return data;
};

// Delete product
export const deleteProductApi = async (id: string) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};

// Get product stats
export const getProductStatsApi = async () => {
  const { data } = await api.get(`/products/stats`);
  return data;
};

// Get categories with product count
export const getCategoriesWithCountApi = async (params?: any) => {
  const { data } = await api.get(`/categories/with-count`, {
    params,
  });
  return data;
};

// Get brands with product count
export const getBrandsWithCountApi = async (params?: any) => {
  const { data } = await api.get(`/brands/with-count`, { params });
  return data;
};
