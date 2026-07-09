import { Schema, Document, Connection, Model } from "mongoose";

export interface IBranchEmployee extends Document {
  name: string;
  email: string;
  phone: string;
  position: string;
  salary: number;
  joinDate: Date;
  status: "active" | "inactive";
}

const employeeSchema = new Schema<IBranchEmployee>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    position: String,
    salary: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

export const getBranchEmployeeModel = (
  branchDb: Connection,
): Model<IBranchEmployee> => {
  return branchDb.model<IBranchEmployee>("Employee", employeeSchema);
};
