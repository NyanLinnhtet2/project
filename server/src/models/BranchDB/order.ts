import { Schema, Document, Connection, Model } from "mongoose";

export interface IOrder extends Document {
  orderNumber: string;
  customerName: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    items: [
      {
        productId: String,
        name: String,
        quantity: Number,
        price: Number,
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const getOrderModel = (branchDb: Connection): Model<IOrder> => {
  return branchDb.model<IOrder>("Order", orderSchema);
};
