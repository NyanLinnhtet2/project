import api from "../api/axiosInstance";

import type { CreateEmployeeData, UpdateEmployeeData } from "../types/employee";

// Get all employees
export const getEmployeesApi = async () => {
  const { data } = await api.get(`/employees`);
  return data;
};

// Get employee by ID
export const getEmployeeByIdApi = async (id: string) => {
  const { data } = await api.get(`/employees/${id}`);
  return data;
};

// Create employee
export const createEmployeeApi = async (employeeData: CreateEmployeeData) => {
  const { data } = await api.post(`/employees/create`, employeeData);
  return data;
};

// Update employee
export const updateEmployeeApi = async (
  id: string,
  employeeData: UpdateEmployeeData,
) => {
  const { data } = await api.put(`/employees/${id}`, employeeData);
  return data;
};

// Delete employee
export const deleteEmployeeApi = async (id: string) => {
  const { data } = await api.delete(`/employees/${id}`);
  return data;
};

// Get employee stats
export const getEmployeeStatsApi = async () => {
  const { data } = await api.get(`/employees/stats`);
  return data;
};

// Get employees by branch
export const getEmployeesByBranchApi = async (branchName: string) => {
  const { data } = await api.get(`/employees/branch/${branchName}`);
  return data;
};

// Update employee status
export const updateEmployeeStatusApi = async (id: string, status: string) => {
  const { data } = await api.patch(`/employees/${id}/status`, {
    status,
  });
  return data;
};

export const getManagersForDropdownApi = async () => {
  const { data } = await api.get(`/employees/managers`);
  return data;
};
