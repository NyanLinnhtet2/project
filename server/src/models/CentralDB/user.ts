// src/models/CentralDB/user.ts
import { Schema, Document } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "admin" | "manager" | "cashier";
  status: "active" | "inactive" | "suspended";
  position: string;
  branch: string;
  salary: number; // ✅ Added salary field
  image: {
    url: string;
    public_id: string;
  };
  joinDate: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "manager", "cashier"],
      default: "cashier",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    position: { type: String, required: true },
    branch: { type: String, required: true },
    salary: { type: Number, default: 0 }, // ✅ Salary field
    image: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    joinDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const getCentralUserModel = () => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }
  return centralDBConnection.model<IUser>("User", userSchema);
};
