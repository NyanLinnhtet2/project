import { Schema, Document, Model,Types } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface IStockTransaction extends Document {
  productId: Types.ObjectId;
  branchId: Types.ObjectId;
  transactionType: "INBOUND" | "OUTBOUND" | "ADJUSTMENT";
  quantity: number;
  unitCost: number; // Product ဆီကနေ Snapshot ယူမည့် ဝယ်ရင်းဈေး
  supplierName: string; // Product ဆီကနေ Snapshot ယူမည့် ပွဲရုံအမည်
  totalAmount: number; // quantity * unitCost
  performedBy: string; // Admin သို့မဟုတ် လုပ်ဆောင်သူအမည်
  notes?: string; // မှတ်ချက် (Optional)
  createdAt: Date;
  updatedAt: Date;
}

const stockTransactionSchema = new Schema<IStockTransaction>(
  {
    productId: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    branchId: { type: Schema.Types.ObjectId, required: true, ref: "Branch" },
    transactionType: {
      type: String,
      enum: ["INBOUND", "OUTBOUND", "ADJUSTMENT"],
      default: "INBOUND",
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
