export interface User {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  position?: string;
  role: "admin" | "manager" | "cashier";
  branch: string;
  joinDate?: Date;
  status: "active" | "inactive" | "suspended";
  image?: {
    url: string;
    public_id: string;
  };
}
