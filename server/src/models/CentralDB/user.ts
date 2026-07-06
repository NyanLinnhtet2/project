import { Schema, Document } from "mongoose";
import { centralDBConnection } from "../../db/db";

// 1. Interface တွင် လိုအပ်သော Type များ ထပ်ဖြည့်ခြင်း
interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  position?: string;
  role: "admin" | "manager" | "cashier";
  branch: string;
  joinDate?: Date;
  status: "active" | "inactive" | "suspended"; // Status အတွက်
  image?: {
    url: string;
    public_id: string;
  };
}

// 2. Schema တွင် Field အသစ်များ ထည့်သွင်းခြင်း
const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },

    phone: { type: String, default: "" },
    position: { type: String, default: "" },
    joinDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    role: {
      type: String,
      enum: ["admin", "manager", "cashier"],
      default: "admin",
    },
    branch: { type: String, default: "" },
    image: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  },
);

export const getCentralUserModel = () => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }

  return centralDBConnection.model<IUser>("User", userSchema);
};
