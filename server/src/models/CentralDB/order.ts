import { Schema } from "mongoose";
import { centralDBConnection } from "../../db/db";

const orderSchema = new Schema({
  productName: String,
  quantity: Number,
  totalPrice: Number,
  branchName: { type: String, default: "Yangon" },
  createdAt: { type: Date, default: Date.now },
});

// SAFE MODEL GETTER
export const getCentralOrderModel = () => {
  if (!centralDBConnection) {
    throw new Error("Central DB is not connected");
  }

  return centralDBConnection.model("Order", orderSchema);
};