import { Schema, Document, Model, Types } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface ICustomer extends Document {
  name: string;
  phone: string; // unique — primary lookup key at checkout
  email?: string;
  dateOfBirth?: Date;
  totalSpent: number;
  purchaseCount: number;
  membershipLevel: string; // MembershipTier name — defaults to the lowest tier
  registeredBranch: string; // branch name, where they first signed up
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true },
    dateOfBirth: { type: Date },
    totalSpent: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },
    membershipLevel: { type: String, default: "Bronze" },
    registeredBranch: { type: String, required: true },
  },
  { timestamps: true },
);

customerSchema.index({ phone: 1 });
customerSchema.index({ name: "text" });

export const getCentralCustomerModel = (): Model<ICustomer> => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }
  return (
    (centralDBConnection.models.Customer as Model<ICustomer>) ||
    centralDBConnection.model<ICustomer>("Customer", customerSchema)
  );
};