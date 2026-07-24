import { Schema, Document, Model, Types } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface IDiscountApprovalItem {
  productId: Types.ObjectId;
  name: string;
  category: string;
  brand: string;
  quantity: number;
  price: number;
}

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled";

export interface IDiscountApprovalRequest extends Document {
  branchId: Types.ObjectId;
  branchName: string;
  cashierId: string;
  cashierName: string;
  cashierRole: "cashier" | "manager"; // who's asking — a manager's own request always escalates to admin
  items: IDiscountApprovalItem[];
  subtotal: number;
  discountType: "amount" | "percent";
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  requiredApproverLevel: "manager" | "admin";
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewNote?: string;
  resultingSaleId?: Types.ObjectId; // set once approved and the real Sale is created
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const approvalItemSchema = new Schema<IDiscountApprovalItem>(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    category: { type: String, default: "" },
    brand: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const discountApprovalRequestSchema = new Schema<IDiscountApprovalRequest>(
  {
    branchId: { type: Schema.Types.ObjectId, required: true, ref: "Branch" },
    branchName: { type: String, required: true },
    cashierId: { type: String, required: true },
    cashierName: { type: String, required: true },
    cashierRole: { type: String, enum: ["cashier", "manager"], required: true },
    items: { type: [approvalItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discountType: { type: String, enum: ["amount", "percent"], required: true },
    discountValue: { type: Number, required: true },
    discountAmount: { type: Number, required: true },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: "cash" },
    requiredApproverLevel: {
      type: String,
      enum: ["manager", "admin"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired", "cancelled"],
      default: "pending",
    },
    reviewedBy: { type: String },
    reviewedByName: { type: String },
    reviewNote: { type: String },
    resultingSaleId: { type: Schema.Types.ObjectId },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// manager/admin inbox query, and the cashier polling query
discountApprovalRequestSchema.index({
  status: 1,
  requiredApproverLevel: 1,
  branchId: 1,
});
discountApprovalRequestSchema.index({ cashierId: 1, createdAt: -1 });

export const getCentralDiscountApprovalRequestModel = (): Model<IDiscountApprovalRequest> => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }
  return (
    (centralDBConnection.models
      .DiscountApprovalRequest as Model<IDiscountApprovalRequest>) ||
    centralDBConnection.model<IDiscountApprovalRequest>(
      "DiscountApprovalRequest",
      discountApprovalRequestSchema,
    )
  );
};