import axios from "axios";

import type { CreateEmployeeData, UpdateEmployeeData } from "../types/employee";

const API_URL = import.meta.env.VITE_API_URL;

axios.defaults.withCredentials = true;

// Get all employees
export const getEmployeesApi = async () => {
  const { data } = await axios.get(`${API_URL}/employees`);
  return data;
};

// Get employee by ID
export const getEmployeeByIdApi = async (id: string) => {
  const { data } = await axios.get(`${API_URL}/employees/${id}`);
  return data;
};

// Create employee
export const createEmployeeApi = async (employeeData: CreateEmployeeData) => {
  const { data } = await axios.post(
    `${API_URL}/employees/create`,
    employeeData,
  );
  return data;
};

// Update employee
export const updateEmployeeApi = async (
  id: string,
  employeeData: UpdateEmployeeData,
) => {
  const { data } = await axios.put(`${API_URL}/employees/${id}`, employeeData);
  return data;
};

// Delete employee
export const deleteEmployeeApi = async (id: string) => {
  const { data } = await axios.delete(`${API_URL}/employees/${id}`);
  return data;
};

// Get employee stats
export const getEmployeeStatsApi = async () => {
  const { data } = await axios.get(`${API_URL}/employees/stats`);
  return data;
};

// Get employees by branch
export const getEmployeesByBranchApi = async (branchName: string) => {
  const { data } = await axios.get(`${API_URL}/employees/branch/${branchName}`);
  return data;
};

// Update employee status
export const updateEmployeeStatusApi = async (id: string, status: string) => {
  const { data } = await axios.patch(`${API_URL}/employees/${id}/status`, {
    status,
  });
  return data;
};

export const getManagersForDropdownApi = async () => {
  const { data } = await axios.get(`${API_URL}/employees/managers`);
  return data;
};
