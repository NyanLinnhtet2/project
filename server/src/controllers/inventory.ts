import { Request, Response } from "express";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getCentralProductModel } from "../models/CentralDB/products";
import { getCentralTransferModel } from "../models/CentralDB/transfers";
import { getBranchConnection } from "../db/db";
import { getBranchStockModel } from "../models/BranchDB/stock";
import mongoose from "mongoose";

const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const allocateStock = async (req: Request, res: Response) => {
  try {
    const { branchId, productId, quantity } = req.body;

    if (!branchId || !productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Branch ID, Product ID, and Quantity are required!",
      });
    }

    if (!isValidObjectId(branchId) || !isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Branch ID or Product ID format",
      });
    }

    const Branch = getCentralBranchModel();
    const branch = await Branch.findById(branchId);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found in Central Database",
      });
    }

    const branchDb = getBranchConnection(branch.dbName);
    if (!branchDb) {
      return res.status(500).json({
        success: false,
        message: `Failed to connect to branch database: ${branch.dbName}`,
      });
    }

    const Stock = getBranchStockModel(branchDb);

    let stock = await Stock.findOne({
      productId: new mongoose.Types.ObjectId(productId),
    });
    if (stock) {
      stock.quantity += Number(quantity);
      await stock.save();
    } else {
      stock = await Stock.create({
        productId: new mongoose.Types.ObjectId(productId),
        quantity: Number(quantity),
      });
    }

    return res.status(200).json({
      success: true,
      data: stock,
      message: "Stock allocated successfully",
    });
  } catch (error: any) {
    console.error("❌ Allocate Stock Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getBranchInventory = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;
    const Branch = getCentralBranchModel();
    const Product = getCentralProductModel();

    const branch = await Branch.findById(branchId);
    if (!branch)
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });

    const branchDb = getBranchConnection(branch.dbName);
    const Stock = getBranchStockModel(branchDb);

    const stocks = await Stock.find().lean();

    // Central DB ရှိ Product Data များနှင့် Map ပြုလုပ်ခြင်း
    const inventory = await Promise.all(
      stocks.map(async (stock) => {
        const product = await Product.findById(stock.productId).select(
          "name sku category image",
        );
        return { ...stock, product };
      }),
    );

    return res.status(200).json({ success: true, data: inventory });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const requestTransfer = async (req: Request, res: Response) => {
  try {
    const { fromBranchId, toBranchId, productId, quantity, requestedBy } =
      req.body;
    const Transfer = getCentralTransferModel();

    const newTransfer = await Transfer.create({
      fromBranchId,
      toBranchId,
      productId,
      quantity,
      requestedBy,
    });

    return res.status(201).json({
      success: true,
      data: newTransfer,
      message: "Transfer requested",
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
