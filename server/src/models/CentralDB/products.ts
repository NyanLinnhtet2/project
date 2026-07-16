import { Schema, Document } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface IProductVariant {
  size?: string;
  color?: string;
}

export interface IProduct extends Document {
  name: string;
  sku: string;
  category: string;
  brand: string;
  shopName: string;
  price: number;
  cost: number;
  unit: string;
  status: "active" | "inactive";
  image: {
    url: string;
    public_id: string;
  };
  description: string;
  variants: IProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>({
  size: { type: String, default: "" },
  color: { type: String, default: "" },
});

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    shopName: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, default: 0, min: 0 },
    unit: { type: String, required: true, default: "pcs" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    image: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    description: { type: String, default: "" },
    variants: [productVariantSchema],
  },
  { timestamps: true },
);

export const getCentralProductModel = () => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }
  return centralDBConnection.model<IProduct>("Product", productSchema);
};