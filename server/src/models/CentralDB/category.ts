import { Schema, Document } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface ICategory extends Document {
  name: string;
  description: string;
  status: "active" | "inactive";
}

const categorySchema = new Schema<ICategory>(
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

export const getCentralCategoryModel = () => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }

  return centralDBConnection.model("Category", categorySchema);
};
