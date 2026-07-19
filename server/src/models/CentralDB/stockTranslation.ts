import { Schema, Document, Model, Types } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface IStockTransaction extends Document {
  productId: Types.ObjectId;
  branchId: Types.ObjectId;
  transactionType: "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "DAMAGE";
  quantity: number;
  unitCost: number; 
  supplierName: string; 
  totalAmount: number; 
  performedBy: string; 
  notes?: string; 
  createdAt: Date;
  updatedAt: Date;
}

const stockTransactionSchema = new Schema<IStockTransaction>(
  {
    productId: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    branchId: { type: Schema.Types.ObjectId, required: true, ref: "Branch" },
    transactionType: {
      type: String,
      enum: ["INBOUND", "OUTBOUND", "ADJUSTMENT", "DAMAGE"], // ✅ DAMAGE ထည့်ပြီးပြီ
      default: "INBOUND",
      required: true,
    },
    quantity: { type: Number, required: true },
    unitCost: { type: Number, required: true, default: 0 },
    supplierName: { type: String, default: "" },
    totalAmount: { type: Number, required: true, default: 0 },
    performedBy: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export const getCentralStockTransactionModel = (): Model<IStockTransaction> => {
  if (!centralDBConnection) throw new Error("Central DB not connected");
  return (
    centralDBConnection.models.StockTransaction ||
    centralDBConnection.model<IStockTransaction>(
      "StockTransaction",
      stockTransactionSchema,
    )
  );
};