import { Schema } from "mongoose";
import { centralDBConnection } from "../../db/db";

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
});

export const getCentralUserModel = () => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }

  return centralDBConnection.model("User", userSchema);
};
