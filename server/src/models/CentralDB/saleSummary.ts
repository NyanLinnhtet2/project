import { Schema, Document, Model, Types } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface ISaleSummary extends Document {
  branchId: Types.ObjectId;
  branchName: string;
  saleId: Types.ObjectId;
  saleNumber: string;
  cashierId: string;
  cashierName: string;
  itemCount: number;
  totalAmount: number;
  paymentMethod: string;
  status: "completed" | "voided";
  createdAt: Date;
}

const saleSummarySchema = new Schema<ISaleSummary>(
  {
    branchId: { type: Schema.Types.ObjectId, required: true, ref: "Branch" },
    branchName: { type: String, required: true },
    saleId: { type: Schema.Types.ObjectId, required: true },
    saleNumber: { type: String, required: true },
    cashierId: { type: String, required: true },
    cashierName: { type: String, required: true },
    itemCount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: "cash" },
    status: {
      type: String,
      enum: ["completed", "voided"],
      default: "completed",
    },
  },
  { timestamps: true },
);

// Admin's main query: filter by branch + date range
saleSummarySchema.index({ branchId: 1, createdAt: -1 });

export const getCentralSaleSummaryModel = (): Model<ISaleSummary> => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }
  return (
    (centralDBConnection.models.SaleSummary as Model<ISaleSummary>) ||
    centralDBConnection.model<ISaleSummary>("SaleSummary", saleSummarySchema)
  );
};
