import { Schema, Document, Connection, Model, Types } from "mongoose";

export interface IReturnItem {
  productId: Types.ObjectId;
  name: string;
  category: string;
  brand: string;
  quantity: number;
  price: number; // the original sale's per-unit price (not refundAmount — see below)
  refundAmount: number; // this line's prorated refund (price adjusted for the original sale's discount % and tax %, × quantity)
}

export interface IReturn extends Document {
  returnNumber: string;
  originalSaleId: Types.ObjectId;
  originalSaleNumber: string;
  cashierId: string; // who rang up the original sale
  cashierName: string;
  processedBy: string; // manager/admin who processed this return
  processedByName: string;
  items: IReturnItem[];
  refundAmount: number; // sum of items[].refundAmount
  reason: string;
  type: "return" | "exchange";
  exchangeSaleId?: Types.ObjectId; // set once the replacement Sale is created (type === "exchange")
  createdAt: Date;
  updatedAt: Date;
}

const returnItemSchema = new Schema<IReturnItem>(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    category: { type: String, default: "" },
    brand: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    refundAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const returnSchema = new Schema<IReturn>(
  {
    returnNumber: { type: String, required: true, unique: true },
    originalSaleId: { type: Schema.Types.ObjectId, required: true },
    originalSaleNumber: { type: String, required: true },
    cashierId: { type: String, required: true },
    cashierName: { type: String, required: true },
    processedBy: { type: String, required: true },
    processedByName: { type: String, required: true },
    items: { type: [returnItemSchema], required: true },
    refundAmount: { type: Number, required: true, min: 0 },
    reason: { type: String, default: "" },
    type: { type: String, enum: ["return", "exchange"], default: "return" },
    exchangeSaleId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true },
);

returnSchema.index({ originalSaleId: 1 });
returnSchema.index({ createdAt: -1 });

export const getReturnModel = (branchDb: Connection): Model<IReturn> => {
  return (
    (branchDb.models.Return as Model<IReturn>) ||
    branchDb.model<IReturn>("Return", returnSchema)
  );
};