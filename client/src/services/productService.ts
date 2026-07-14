// src/services/productService.ts
import axios from "axios";
import type {
  Product,
  CreateProductData,
  UpdateProductData,
} from "../types/product";

const API_URL = import.meta.env.VITE_API_URL;

axios.defaults.withCredentials = true;

// Get all products
export const getProductsApi = async (params?: Product) => {
  const { data } = await axios.get(`${API_URL}/products`, { params });
  return data;
};

// Get product by ID
export const getProductByIdApi = async (id: string) => {
  const { data } = await axios.get(`${API_URL}/products/${id}`);
  return data;
};

// Create product
export const createProductApi = async (productData: CreateProductData) => {
  const { data } = await axios.post(`${API_URL}/products/create`, productData);
  return data;
};

// Update product
export const updateProductApi = async (
  id: string,
  productData: UpdateProductData,
) => {
  const { data } = await axios.put(`${API_URL}/products/${id}`, productData);
  return data;
};

// Delete product
export const deleteProductApi = async (id: string) => {
  const { data } = await axios.delete(`${API_URL}/products/${id}`);
  return data;
};

// Update product stock
export const updateProductStockApi = async (id: string, quantity: number) => {
  const { data } = await axios.patch(`${API_URL}/products/${id}/stock`, {
    quantity,
  });
  return data;
};

// Get product stats
export const getProductStatsApi = async () => {
  const { data } = await axios.get(`${API_URL}/products/stats`);
  return data;
};
