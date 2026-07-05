import { Schema } from "mongoose";
import { centralDBConnection } from "../../db/db";

interface IBrand extends Document {
  name: string;
  description: string;
  status: "active" | "inactive";
}

const brandSchema = new Schema<IBrand>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

export const getCentralBrandModel = () => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }

  return centralDBConnection.model<IBrand>("Brand", brandSchema);
};
