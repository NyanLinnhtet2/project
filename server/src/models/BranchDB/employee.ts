// src/models/BranchDB/employee.ts
import { Schema, Document, Connection, Model } from "mongoose";

export interface IBranchEmployee extends Document {
  name: string;
  email: string;
  phone: string;
  position: string;
  salary: number;
  joinDate: Date;
  status: "active" | "inactive" | "suspended";
  image: {
    url: string;
    public_id: string;
  };
  isActive: boolean;
}

const employeeSchema = new Schema<IBranchEmployee>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    position: { type: String, required: true },
    salary: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    image: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    // "Not Assigned" ကို မရေတွက်ရန်
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Middleware: "Not Assigned" ဆိုရင် isActive ကို false ထားရန်
employeeSchema.pre<IBranchEmployee>("save", function () {
  if (this.name === "Not Assigned" || this.email.includes("notassigned")) {
    this.isActive = false;
  }
});

export const getBranchEmployeeModel = (
  branchDb: Connection,
): Model<IBranchEmployee> => {
  // Check if model already exists
  if (branchDb.models["Employee"]) {
    return branchDb.models["Employee"] as Model<IBranchEmployee>;
  }
  return branchDb.model<IBranchEmployee>("Employee", employeeSchema);
};
