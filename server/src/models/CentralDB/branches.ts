import { Schema, Document } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface IBranch extends Document {
  name: string;
  code: string; // ဥပမာ - YGN, MDY (Unique ဖြစ်သင့်ပါတယ်)
  address: string;
  phone: string;
  email: string;
  manager: string;
  dbName: string; // 🌟 ဤဆိုင်ခွဲအတွက် သီးသန့် Database အမည်
  status: "active" | "inactive";
}

const branchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    address: String,
    phone: String,
    email: String,
    manager: String,
    dbName: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active", // Default အနေနဲ့ active ထားပေးတာ ပိုကောင်းပါတယ်
    },
  },
  { timestamps: true },
);

export const getCentralBranchModel = () => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }
  return centralDBConnection.model<IBranch>("Branch", branchSchema);
};
