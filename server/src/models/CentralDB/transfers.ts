import { Schema, Document } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface ITransfer extends Document {
  fromBranchId: Schema.Types.ObjectId;
  toBranchId: Schema.Types.ObjectId;
  productId: Schema.Types.ObjectId;
  quantity: number;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  approvedBy?: string;
  createdAt: Date;
}

const transferSchema = new Schema<ITransfer>(
  {
    fromBranchId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Branch",
    },
    toBranchId: { type: Schema.Types.ObjectId, required: true, ref: "Branch" },
    productId: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    quantity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    requestedBy: { type: String, required: true },
    approvedBy: { type: String },
  },
  { timestamps: true },
);

export const getCentralTransferModel = () => {
  if (!centralDBConnection) throw new Error("Central DB not connected");
  return (
    centralDBConnection.models.Transfer ||
    centralDBConnection.model<ITransfer>("Transfer", transferSchema)
  );
};
