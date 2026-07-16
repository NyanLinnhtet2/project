import { createContext } from "react";
import type { User } from "../types/user";

export interface AuthContextType {
  userInfo: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);