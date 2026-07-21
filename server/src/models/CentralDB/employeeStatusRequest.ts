// src/models/CentralDB/employeeStatusRequest.ts
import { Schema, Document, Model, Types } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface IEmployeeStatusRequest extends Document {
  employeeId: Types.ObjectId;
  employeeName: string;
  branch: string;
  currentStatus: "active" | "inactive" | "suspended";
  requestedStatus: "active" | "inactive" | "suspended";
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedBy: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const employeeStatusRequestSchema = new Schema<IEmployeeStatusRequest>(
  {
    employeeId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    employeeName: { type: String, required: true },
    branch: { type: String, required: true },
    currentStatus: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      required: true,
    },
    requestedStatus: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      required: true,
    },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    requestedBy: { type: String, required: true },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true },
);

export const getCentralEmployeeStatusRequestModel =
  (): Model<IEmployeeStatusRequest> => {
    if (!centralDBConnection) throw new Error("Central DB not connected");
    return (
      centralDBConnection.models.EmployeeStatusRequest ||
      centralDBConnection.model<IEmployeeStatusRequest>(
        "EmployeeStatusRequest",
        employeeStatusRequestSchema,
      )
    );
  };
