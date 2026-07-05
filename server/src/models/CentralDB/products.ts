import { Schema, Types } from "mongoose";
import { centralDBConnection } from "../../db/db";

interface IProduct extends Document {
  name: string;
  description: string;
  brand: Types.ObjectId;
  category: Types.ObjectId;
  colors: string[];
  sizes: string[];
  status: "active" | "inactive";
}

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    brand: {
      type: Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    category: {
      type: Types.ObjectId,
      ref: "Category",
      required: true,
    },

    colors: [
      {
        type: String,
        trim: true,
      },
    ],

    sizes: [
      {
        type: String,
        trim: true,
      },
    ],

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

export const getCentralProductModel = () => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }

  return centralDBConnection.model("Product", productSchema);
};
