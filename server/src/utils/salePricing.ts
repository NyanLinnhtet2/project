import mongoose, { Connection, Model } from "mongoose";
import { getCentralProductModel } from "../models/CentralDB/products";
import { getBranchStockModel } from "../models/BranchDB/stock";
import type { IStock } from "../models/BranchDB/stock";

export interface PricedItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  brand: string;
  quantity: number;
  price: number;
}

export type PriceItemsResult =
  | { ok: true; items: PricedItem[]; subtotal: number }
  | { ok: false; status: number; message: string };

// Prices every item from CentralDB (never trust a client-sent price) and
// checks branch stock is sufficient. Does NOT deduct stock — callers decide
// when that happens (immediate sale vs. reserved-while-pending-approval).
export const priceAndValidateItems = async (
  items: { productId: string; quantity: number }[],
  branchDb: Connection,
): Promise<PriceItemsResult> => {
  const Product = getCentralProductModel();
  const Stock = getBranchStockModel(branchDb);
  const priced: PricedItem[] = [];

  for (const item of items) {
    const productData = await Product.findById(item.productId);
    if (!productData) {
      return {
        ok: false,
        status: 404,
        message: `Product not found: ${item.productId}`,
      };
    }

    const stock = await Stock.findOne({
      productId: new mongoose.Types.ObjectId(item.productId),
    });

    if (!stock || stock.quantity < item.quantity) {
      return {
        ok: false,
        status: 400,
        message: `Not enough stock for "${productData.name}". Available: ${stock?.quantity ?? 0}`,
      };
    }

    priced.push({
      productId: new mongoose.Types.ObjectId(item.productId),
      name: productData.name,
      category: productData.category,
      brand: productData.brand,
      quantity: item.quantity,
      price: productData.price,
    });
  }

  const subtotal = priced.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { ok: true, items: priced, subtotal };
};

// Applies a quantity change via fetch → mutate → save so the Stock model's
// pre-save hook (which recomputes `status`: In Stock/Low Stock/Out of
// Stock) actually runs. A raw `updateOne({ $inc: { quantity } })` bypasses
// Mongoose document middleware entirely — that was silently leaving
// `status` stale after every sale, return, and void, which is why the
// Inventory page and the low-stock notifications could disagree.
export const applyStockDelta = async (
  Stock: Model<IStock>,
  productId: mongoose.Types.ObjectId,
  delta: number,
) => {
  const stock = await Stock.findOne({ productId });
  if (!stock) return;
  stock.quantity = Math.max(0, stock.quantity + delta);
  await stock.save();
};

export const deductStockForItems = async (
  items: { productId: mongoose.Types.ObjectId; quantity: number }[],
  branchDb: Connection,
) => {
  const Stock = getBranchStockModel(branchDb);
  for (const item of items) {
    await applyStockDelta(Stock, item.productId, -item.quantity);
  }
};

export const restockItems = async (
  items: { productId: mongoose.Types.ObjectId; quantity: number }[],
  branchDb: Connection,
) => {
  const Stock = getBranchStockModel(branchDb);
  for (const item of items) {
    await applyStockDelta(Stock, item.productId, item.quantity);
  }
};

// Discount resolved to a Ks amount and clamped so it can never exceed the
// subtotal (a stray flat-amount discount, or float drift on a percent
// discount) — total can never go negative.
export const computeDiscountAndTax = (
  subtotal: number,
  discountType: "amount" | "percent",
  discountValue: number,
  taxRate: number,
) => {
  let discountAmount =
    discountType === "percent"
      ? Math.round((subtotal * discountValue) / 100)
      : Math.round(discountValue);
  discountAmount = Math.min(Math.max(discountAmount, 0), subtotal);

  const taxableAmount = subtotal - discountAmount;
  const taxAmount = Math.round((taxableAmount * taxRate) / 100);
  const totalAmount = taxableAmount + taxAmount;

  return { discountAmount, taxAmount, totalAmount };
};