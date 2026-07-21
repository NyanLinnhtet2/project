export interface Employee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  branch: string;
  role: "admin" | "manager" | "cashier";
  status: "active" | "inactive" | "suspended";
  salary: number;
  image: {
    url: string;
    public_id: string;
  };
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeData {
  name: string;
  email: string;
  phone: string;
  position: string;
  branch: string;
  role: "admin" | "manager" | "cashier";
  status?: "active" | "inactive" | "suspended";
  password: string;
  salary?: number;
  avatar?: string;
}

export interface UpdateEmployeeData {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  branch?: string;
  role?: "admin" | "manager" | "cashier";
  status?: "active" | "inactive" | "suspended";
  password?: string;
  salary?: number;
  avatar?: string;
}

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  totalSalary: number;
  roles: {
    admin: number;
    manager: number;
    cashier: number;
  };
}
export interface EmployeeStatusRequest {
  _id: string;
  employeeId: string;
  employeeName: string;
  branch: string;
  currentStatus: "active" | "inactive" | "suspended";
  requestedStatus: "active" | "inactive" | "suspended";
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNote?: string;
  createdAt: string;
}

export interface EmployeeStatusRequestPayload {
  employeeId: string;
  requestedStatus: "active" | "inactive" | "suspended";
  reason: string;
  requestedBy: string;
}
