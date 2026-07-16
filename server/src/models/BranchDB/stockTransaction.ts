import { Schema, Document, Connection, Model } from "mongoose";

export interface IStockTransaction extends Document {
  productId: string;
  productName: string;
  sku: string;
  branch: string;
  type: "purchase" | "sale" | "return" | "adjustment" | "transfer" | "received";
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  note: string;
  supplier?: string;
  createdBy: string;
  createdAt: Date;
}

const stockTransactionSchema = new Schema<IStockTransaction>(
  {
    productId: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true, index: true },
    branch: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["purchase", "sale", "return", "adjustment", "transfer", "received"],
      required: true,
    },
    quantity: { type: Number, required: true },
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    note: { type: String, default: "" },
    supplier: { type: String, default: "" },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export const getStockTransactionModel = (branchDb: Connection): Model<IStockTransaction> => {
  if (branchDb.models["StockTransaction"]) {
    return branchDb.models["StockTransaction"] as Model<IStockTransaction>;
  }
  return branchDb.model<IStockTransaction>("StockTransaction", stockTransactionSchema);
};