import { Schema, Document, Model, Types } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface IStockEditRequest extends Document {
  branchId: Types.ObjectId;
  productId: Types.ObjectId;
  currentQuantity: number;   
  requestedQuantity: number; 
  changeAmount: number;      
  reason: string;            
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedBy: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  adminNote?: string;      
  createdAt: Date;
  updatedAt: Date;
}

const stockEditRequestSchema = new Schema<IStockEditRequest>(
  {
    branchId: { type: Schema.Types.ObjectId, required: true, ref: "Branch" },
    productId: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    currentQuantity: { type: Number, required: true },
    requestedQuantity: { type: Number, required: true, min: 0 },
    changeAmount: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    requestedBy: { type: String, required: true },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true },
);

export const getCentralStockEditRequestModel = (): Model<IStockEditRequest> => {
  if (!centralDBConnection) throw new Error("Central DB not connected");
  return (
    centralDBConnection.models.StockEditRequest ||
    centralDBConnection.model<IStockEditRequest>(
      "StockEditRequest",
      stockEditRequestSchema,
    )
  );
};