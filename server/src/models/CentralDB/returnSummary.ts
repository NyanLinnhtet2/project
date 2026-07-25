import { Schema, Document, Model, Types } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface IReturnSummary extends Document {
  branchId: Types.ObjectId;
  branchName: string;
  returnId: Types.ObjectId; // reference back to the Return document inside that branch's DB
  returnNumber: string;
  originalSaleId: Types.ObjectId;
  originalSaleNumber: string;
  itemCount: number;
  refundAmount: number;
  type: "return" | "exchange";
  processedBy: string;
  processedByName: string;
  createdAt: Date;
}

const returnSummarySchema = new Schema<IReturnSummary>(
  {
    branchId: { type: Schema.Types.ObjectId, required: true, ref: "Branch" },
    branchName: { type: String, required: true },
    returnId: { type: Schema.Types.ObjectId, required: true },
    returnNumber: { type: String, required: true },
    originalSaleId: { type: Schema.Types.ObjectId, required: true },
    originalSaleNumber: { type: String, required: true },
    itemCount: { type: Number, required: true },
    refundAmount: { type: Number, required: true },
    type: { type: String, enum: ["return", "exchange"], default: "return" },
    processedBy: { type: String, required: true },
    processedByName: { type: String, required: true },
  },
  { timestamps: true },
);

returnSummarySchema.index({ branchId: 1, createdAt: -1 });

export const getCentralReturnSummaryModel = (): Model<IReturnSummary> => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }
  return (
    (centralDBConnection.models.ReturnSummary as Model<IReturnSummary>) ||
    centralDBConnection.model<IReturnSummary>(
      "ReturnSummary",
      returnSummarySchema,
    )
  );
};