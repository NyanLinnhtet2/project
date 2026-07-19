import { Request, Response } from "express";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getCentralProductModel } from "../models/CentralDB/products";
import { getCentralTransferModel } from "../models/CentralDB/transfers";
import { getBranchConnection } from "../db/db";
import { getBranchStockModel } from "../models/BranchDB/stock";
import { getCentralStockTransactionModel } from "../models/CentralDB/stockTranslation";
import mongoose from "mongoose";

const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const allocateStock = async (req: Request, res: Response) => {
  try {
    // performedBy ကို req.body (သို့) req.user ကနေ ယူပါမည်
    const { branchId, productId, quantity, performedBy, notes } = req.body;

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

    // 🌟 အဆင့် ၁: Product ထံမှ လက်ရှိ Cost နှင့် Supplier ကို ရယူခြင်း (Snapshot အတွက်)
    const Product = getCentralProductModel();
    const productData = await Product.findById(productId);

    if (!productData) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const currentCost = productData.cost || 0;
    const currentSupplier = productData.shopName || "Unknown Supplier";
    const totalAmount = currentCost * Number(quantity);

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

    // 🌟 အဆင့် ၂: Stock Transaction အသစ်ကို Central DB တွင် မှတ်တမ်းတင်ခြင်း
    const StockTransaction = getCentralStockTransactionModel();
    const transaction = await StockTransaction.create({
      productId: new mongoose.Types.ObjectId(productId),
      branchId: new mongoose.Types.ObjectId(branchId),
      transactionType: "INBOUND",
      quantity: Number(quantity),
      unitCost: currentCost,
      supplierName: currentSupplier,
      totalAmount: totalAmount,
      performedBy: performedBy || "Admin", // Login ဝင်ထားသူ အမည်ထည့်ရန်
      notes: notes || "",
    });

    return res.status(200).json({
      success: true,
      data: stock,
      transaction: transaction, // Front-end သိစေရန် ထည့်ပေးလိုက်ပါသည်
      message: "Stock allocated and transaction recorded successfully",
    });
  } catch (error: any) {
    console.error("❌ Allocate Stock Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// 🌟 (အသစ်ထည့်ရန်) Stock History များကို ဆွဲထုတ်ပေးမည့် API
export const getStockTransactions = async (req: Request, res: Response) => {
  try {
    const { branchId, transactionType, limit = 50 } = req.query;

    const filter: any = {};
    if (branchId) filter.branchId = branchId;
    if (transactionType) filter.transactionType = transactionType;

    const StockTransaction = getCentralStockTransactionModel();

    const transactions = await StockTransaction.find(filter)
      .populate("productId", "name sku image category") // Product Details တွဲပါမည်
      .populate("branchId", "name code") // Branch Details တွဲပါမည်
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error: any) {
    console.error("❌ Get Stock Transactions Error:", error);
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

export const deductStock = async (req: Request, res: Response) => {
  try {
    const {
      branchId,
      productId,
      quantity,
      performedBy,
      notes,
      transactionType = "OUTBOUND",
    } = req.body;

    // Validate required fields
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

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    // 1. Find Branch
    const Branch = getCentralBranchModel();
    const branch = await Branch.findById(branchId);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found in Central Database",
      });
    }

    // 2. Get Product Data
    const Product = getCentralProductModel();
    const productData = await Product.findById(productId);

    if (!productData) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const currentCost = productData.cost || 0;
    const currentSupplier = productData.shopName || "Unknown Supplier";
    const totalAmount = currentCost * Number(quantity);

    // 3. Connect to Branch Database
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

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock not found in this branch",
      });
    }

    // 4. Check if enough stock
    if (stock.quantity < Number(quantity)) {
      return res.status(400).json({
        success: false,
        message: `Cannot deduct stock. Current available quantity is only ${stock.quantity}`,
      });
    }

    // 5. Deduct Stock
    const oldQuantity = stock.quantity;
    stock.quantity -= Number(quantity);
    await stock.save();

    // 6. Create Transaction Record
    const StockTransaction = getCentralStockTransactionModel();
    const transaction = await StockTransaction.create({
      productId: new mongoose.Types.ObjectId(productId),
      branchId: new mongoose.Types.ObjectId(branchId),
      transactionType: transactionType,
      quantity: Number(quantity),
      unitCost: currentCost,
      supplierName: currentSupplier,
      totalAmount: totalAmount,
      performedBy: performedBy || "Admin",
      notes: notes || "Stock deduction / deletion",
    });

    return res.status(200).json({
      success: true,
      data: stock,
      transaction: transaction,
      message: "Stock deducted and transaction recorded successfully",
    });
  } catch (error: any) {
    console.error("❌ Deduct Stock Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
