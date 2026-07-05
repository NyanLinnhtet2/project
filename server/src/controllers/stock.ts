import { Request, Response } from "express";
import { getYGNBranchStockModel } from "../models/YGNBranchDB/stock";

export const updateBranchStock = async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = req.body;

    const StockModel = getYGNBranchStockModel();

    const updatedStock = await StockModel.findOneAndUpdate(
      { product: productId },
      { $inc: { quantity: quantity } },
      { new: true, upsert: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Branch stock updated successfully",
      data: updatedStock,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBranchStocks = async (req: Request, res: Response) => {
  try {
    const StockModel = getYGNBranchStockModel();

    const stocks = await StockModel.find().populate("product");

    return res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


