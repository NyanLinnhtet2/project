import { Schema } from "mongoose";
import { centralDBConnection } from "../../db/db";

interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "cashier";
  branch: string;
  image?: {
    url: string;
    public_id: string;
  };
}

const userSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
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
});

export const getCentralUserModel = () => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }

  return centralDBConnection.model("User", userSchema);
};
