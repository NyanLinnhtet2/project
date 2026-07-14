// src/models/BranchDB/stock.ts
import { Schema, Document, Connection, Model } from "mongoose";

export interface IBranchStock extends Document {
  productId: string; // Reference to Central DB Product
  productSku: string;
  productName: string;
  quantity: number;
  branch: string;
  unit: string;
  lastUpdated: Date;
  status: "in-stock" | "low-stock" | "out-of-stock";
}

const stockSchema = new Schema<IBranchStock>(
  {
    productId: { type: String, required: true, index: true },
    productSku: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    branch: { type: String, required: true, index: true },
    unit: { type: String, required: true, default: "pcs" },
    lastUpdated: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["in-stock", "low-stock", "out-of-stock"],
      default: "out-of-stock",
    },
  },
  { timestamps: true },
);

stockSchema.pre<IBranchStock>("save", function () {
  if (this.quantity <= 0) {
    this.status = "out-of-stock";
  } else if (this.quantity < 10) {
    this.status = "low-stock";
  } else {
    this.status = "in-stock";
  }
  this.lastUpdated = new Date();
});

export const getStockModel = (branchDb: Connection): Model<IBranchStock> => {
  if (branchDb.models["Stock"]) {
    return branchDb.models["Stock"] as Model<IBranchStock>;
  }
  return branchDb.model<IBranchStock>("Stock", stockSchema);
};
