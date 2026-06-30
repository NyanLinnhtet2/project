import { Schema } from "mongoose";
import { ygBranchDBConnection } from "../../db/db";

const saleSchema = new Schema({
  productName: String,
  price: Number,
  branch: String,
});

export const getYGBranchSaleModel = () => {
  if (!ygBranchDBConnection) {
    throw new Error("YG Branch DB is not connected");
  }

  return ygBranchDBConnection.model("Sale", saleSchema);
};