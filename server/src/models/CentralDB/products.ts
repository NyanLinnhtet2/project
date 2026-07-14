// src/models/CentralDB/products.ts
import { Schema, Document } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface IProduct extends Document {
  name: string;
  sku: string;
  category: string;
  brand: string;
  shopName: string;
  price: number;
  cost: number;
  unit: string;
  status: "active" | "inactive" | "out-of-stock";
  image: {
    url: string;
    public_id: string;
  };
  description: string;
  branch: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    shopName: { type: String, default: "" }, // ✅ Add this field
    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, default: 0, min: 0 },
    unit: { type: String, required: true, default: "pcs" },
    status: {
      type: String,
      enum: ["active", "inactive", "out-of-stock"],
      default: "active",
    },
    image: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    description: { type: String, default: "" },
    branch: { type: String, required: true },
  },
  { timestamps: true },
);

export const getCentralProductModel = () => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }
  return centralDBConnection.model<IProduct>("Product", productSchema);
};
