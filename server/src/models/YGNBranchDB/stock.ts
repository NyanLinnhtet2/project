import { Schema } from "mongoose";
import { ygBranchDBConnection } from "../../db/db";

const stockSchema = new Schema({
  productName: String,
  availableStock: Number,
  lastUpdated: { type: Date, default: Date.now },
});

export const getYGBranchSaleModel = () => {
  if (!ygBranchDBConnection) {
    throw new Error("YG Branch DB is not connected");
  }

  return ygBranchDBConnection.model("Stock", stockSchema);
};
