import { Schema, Document, Connection, Model, Types } from "mongoose";

export interface ISaleItem {
  productId: Types.ObjectId;
  name: string;
  quantity: number;
  price: number; // sale-time snapshot of Product.price (avoid retroactive changes if price updates later)
}

export interface ISale extends Document {
  saleNumber: string;
  cashierId: string; // CentralDB User _id (kept as string like other Branch models reference IDs across DBs)
  cashierName: string;
  items: ISaleItem[];
  totalAmount: number;
  paymentMethod: "cash" | "kbz_pay" | "wave_pay" | "card" | "other";
  status: "completed" | "voided";
  voidedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const saleItemSchema = new Schema<ISaleItem>(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const saleSchema = new Schema<ISale>(
  {
    saleNumber: { type: String, required: true, unique: true },
    cashierId: { type: String, required: true },
    cashierName: { type: String, required: true },
    items: { type: [saleItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["cash", "kbz_pay", "wave_pay", "card", "other"],
      default: "cash",
    },
    status: {
      type: String,
      enum: ["completed", "voided"],
      default: "completed",
    },
    voidedReason: { type: String, default: "" },
  },
  { timestamps: true },
);

// index for the two most common queries: cashier's own list, and "today's sales" for manager
saleSchema.index({ cashierId: 1, createdAt: -1 });
saleSchema.index({ createdAt: -1 });

export const getSaleModel = (branchDb: Connection): Model<ISale> => {
  return (
    (branchDb.models.Sale as Model<ISale>) ||
    branchDb.model<ISale>("Sale", saleSchema)
  );
};