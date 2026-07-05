import { Schema } from "mongoose";
import { centralDBConnection } from "../../db/db";

interface IBranch extends Document {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  status: "active" | "inactive";
}

const branchSchema = new Schema<IBranch>({
  name: String,
  code: String,
  address: String,
  phone: String,
  email: String,
  manager: String,
  status: {
    type: String,
    enum: ["active", "inactive"],
  },
});

export const getCentralBranchModel = () => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }

  return centralDBConnection.model<IBranch>("Branch", branchSchema);
};
