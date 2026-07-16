// src/models/BranchDB/stock.ts
import { Schema, Document, Connection, Model } from "mongoose";

export interface IStock extends Document {
  productId: string;
  productSku: string;
  productName: string;
  branch: string;
  quantity: number;
  unit: string;
  variants: Array<{
    size: string;
    color: string;
  }>;
  lastUpdated: Date;
  status: "in-stock" | "low-stock" | "out-of-stock";

  createdAt: Date;
  updatedAt: Date;
}

const stockSchema = new Schema<IStock>(
  {
    productId: { type: String, required: true, index: true },
    productSku: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    branch: { type: String, required: true, index: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    unit: { type: String, required: true, default: "pcs" },
    variants: [
      {
        size: { type: String, default: "" },
        color: { type: String, default: "" },
      },
    ],
    lastUpdated: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["in-stock", "low-stock", "out-of-stock"],
      default: "out-of-stock",
    },
  },
  { timestamps: true }
);

stockSchema.pre<IStock>("save", function() {
  if (this.quantity <= 0) {
    this.status = "out-of-stock";
  } else if (this.quantity < 10) {
    this.status = "low-stock";
  } else {
    this.status = "in-stock";
  }
  this.lastUpdated = new Date();
  
});

export const getStockModel = (branchDb: Connection): Model<IStock> => {
  if (branchDb.models["Stock"]) {
    return branchDb.models["Stock"] as Model<IStock>;
  }
  return branchDb.model<IStock>("Stock", stockSchema);
};