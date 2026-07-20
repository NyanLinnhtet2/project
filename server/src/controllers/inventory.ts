import { Request, Response } from "express";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getCentralProductModel } from "../models/CentralDB/products";
import { getCentralTransferModel } from "../models/CentralDB/transfers";
import { getBranchConnection } from "../db/db";
import { getBranchStockModel } from "../models/BranchDB/stock";
import { getCentralStockTransactionModel } from "../models/CentralDB/stockTranslation";
import { getCentralStockEditRequestModel } from "../models/CentralDB/stockEditRequest";
import mongoose from "mongoose";

const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ============================================================
// 🌟 FIX: resolveBranch — accepts either a real ObjectId
// (used by the admin dashboard) OR a branch name string like
// "Yangon" (used by the manager dashboard, since userInfo.branch
// currently stores the name, not the _id). This lets both callers
// keep working without needing to touch how auth stores the user.
// ============================================================
const resolveBranch = async (branchIdOrName: string) => {
  const Branch = getCentralBranchModel();
  if (isValidObjectId(branchIdOrName)) {
    return await Branch.findById(branchIdOrName);
  }
  return await Branch.findOne({ name: branchIdOrName });
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

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID format",
      });
    }

    const branch = await resolveBranch(branchId);

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
      branchId: branch._id, // ✅ resolve ပြီးသား real ObjectId
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

// 🌟 Stock History များကို ဆွဲထုတ်ပေးမည့် API
export const getStockTransactions = async (req: Request, res: Response) => {
  try {
    const { branchId, transactionType, limit = 50 } = req.query;

    const filter: any = {};
    if (branchId) {
      // ✅ FIX: branchId query သည် name (Manager) သို့မဟုတ် ObjectId (Admin) ဖြစ်နိုင်သည်
      const branch = await resolveBranch(branchId as string);
      if (branch) filter.branchId = branch._id;
    }
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

    // ✅ path param ဖြစ်လို့ string ဖြစ်ရမယ်၊ ဒါပေမယ့် guard ထားပါ
    if (!branchId || typeof branchId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required",
      });
    }

    const branch = await resolveBranch(branchId);
    if (!branch)
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });

    const Product = getCentralProductModel();
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

    // ✅ FIX: transfer requests တွေမှာလည်း branch name ဖြင့် ဝင်လာနိုင်လို့ resolve လုပ်ပါ
    const fromBranch = await resolveBranch(fromBranchId);
    const toBranch = await resolveBranch(toBranchId);

    if (!fromBranch || !toBranch) {
      return res.status(404).json({
        success: false,
        message: "From/To branch not found",
      });
    }

    const newTransfer = await Transfer.create({
      fromBranchId: fromBranch._id,
      toBranchId: toBranch._id,
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
      transactionType,
    } = req.body;

    // 0. Validate transactionType (Deduct အတွက် INBOUND မဖြစ်သင့်ပါ)
    const allowedDeductTypes = ["OUTBOUND", "DAMAGE", "ADJUSTMENT"];
    if (!transactionType || !allowedDeductTypes.includes(transactionType)) {
      return res.status(400).json({
        success: false,
        message: `transactionType must be one of: ${allowedDeductTypes.join(", ")}`,
      });
    }

    // 1. Validate required fields
    if (!branchId || !productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Branch ID, Product ID, and Quantity are required!",
      });
    }

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID format",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    // 2. Resolve Branch (ObjectId သို့မဟုတ် name)
    const branch = await resolveBranch(branchId);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found in Central Database",
      });
    }

    // 3. Get Product Data
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

    // 4. Connect to Branch Database
    const branchDb = getBranchConnection(branch.dbName);
    if (!branchDb) {
      return res.status(500).json({
        success: false,
        message: `Failed to connect to branch database: ${branch.dbName}`,
      });
    }

    const Stock = getBranchStockModel(branchDb);

    const stock = await Stock.findOne({
      productId: new mongoose.Types.ObjectId(productId),
    });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock not found in this branch",
      });
    }

    // 5. Check if enough stock
    if (stock.quantity < Number(quantity)) {
      return res.status(400).json({
        success: false,
        message: `Cannot deduct stock. Current available quantity is only ${stock.quantity}`,
      });
    }

    // 6. Deduct Stock
    stock.quantity -= Number(quantity);
    await stock.save();

    // 7. Create Transaction Record
    const StockTransaction = getCentralStockTransactionModel();
    const transaction = await StockTransaction.create({
      productId: new mongoose.Types.ObjectId(productId),
      branchId: branch._id, // ✅ resolve ပြီးသား real ObjectId
      transactionType,
      quantity: -Number(quantity), // ✅ negative အနေနဲ့ save (stock လျော့ကြောင်း သိအောင်)
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

// 🌟 Manager: Stock Edit Request တင်ခြင်း
export const requestStockEdit = async (req: Request, res: Response) => {
  try {
    const { branchId, productId, requestedQuantity, reason, requestedBy } =
      req.body;

    if (
      !branchId ||
      !productId ||
      requestedQuantity === undefined ||
      !reason?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Branch ID, Product ID, Requested Quantity, and Reason are required!",
      });
    }

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID format",
      });
    }

    if (requestedQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity cannot be negative",
      });
    }

    // ✅ FIX: branchId ("Yangon" လို name) ကို resolve လုပ်ပါ — Manager UI က
    // userInfo.branch (name) ကို တိုက်ရိုက်ပို့နေတာမို့ isValidObjectId check
    // ကို ဒီနေရာမှာ ဖယ်ထားပြီး resolveBranch ကသာ တာဝန်ယူပါမည်
    const branch = await resolveBranch(branchId);
    if (!branch) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    const branchDb = getBranchConnection(branch.dbName);
    if (!branchDb) {
      return res.status(500).json({
        success: false,
        message: `Failed to connect to branch database: ${branch.dbName}`,
      });
    }

    const Stock = getBranchStockModel(branchDb);
    const stock = await Stock.findOne({
      productId: new mongoose.Types.ObjectId(productId),
    });

    // Stock မရှိသေးရင် လက်ရှိ 0 လို့ သတ်မှတ်
    const currentQuantity = stock ? stock.quantity : 0;

    if (Number(requestedQuantity) === currentQuantity) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity is the same as current quantity",
      });
    }

    const StockEditRequest = getCentralStockEditRequestModel();
    const request = await StockEditRequest.create({
      branchId: branch._id, // ✅ resolve ပြီးသား real ObjectId ကိုသာ သိမ်းပါ
      productId: new mongoose.Types.ObjectId(productId),
      currentQuantity,
      requestedQuantity: Number(requestedQuantity),
      changeAmount: Number(requestedQuantity) - currentQuantity,
      reason: reason.trim(),
      requestedBy: requestedBy || "Manager",
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      data: request,
      message: "Stock edit request submitted. Waiting for admin approval.",
    });
  } catch (error: any) {
    console.error("❌ Request Stock Edit Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// 🌟 Admin/Manager: Requests list ကြည့်ခြင်း
export const getStockEditRequests = async (req: Request, res: Response) => {
  try {
    const { branchId, status } = req.query;

    const filter: any = {};

    if (branchId && typeof branchId === "string") {
      const branch = await resolveBranch(branchId);
      if (branch) filter.branchId = branch._id;
    }
    if (status && typeof status === "string") filter.status = status;

    const StockEditRequest = getCentralStockEditRequestModel();
    const requests = await StockEditRequest.find(filter)
      .populate("productId", "name sku image category")
      .populate("branchId", "name code")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: requests });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// 🌟 Admin: Request ကို Approve လုပ်ပြီး Stock ကို တကယ် ပြင်ခြင်း
export const approveStockEditRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewedBy, adminNote } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request ID" });
    }

    const StockEditRequest = getCentralStockEditRequestModel();
    const editRequest = await StockEditRequest.findById(id);

    if (!editRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }
    if (editRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${editRequest.status.toLowerCase()}`,
      });
    }

    // editRequest.branchId သည် requestStockEdit ကနေ resolve ပြီးသား
    // real ObjectId ဖြစ်နေပြီမို့ findById ဖြင့် တိုက်ရိုက် ရှာနိုင်ပါသည်
    const Branch = getCentralBranchModel();
    const branch = await Branch.findById(editRequest.branchId);
    if (!branch) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    const branchDb = getBranchConnection(branch.dbName);
    if (!branchDb) {
      return res.status(500).json({
        success: false,
        message: `Failed to connect to branch database: ${branch.dbName}`,
      });
    }

    const Stock = getBranchStockModel(branchDb);
    let stock = await Stock.findOne({ productId: editRequest.productId });

    // Re-check: request တင်ချိန်နဲ့ approve ချိန်ကြား quantity ပြောင်းမသွားလား
    const liveQuantity = stock ? stock.quantity : 0;
    if (liveQuantity !== editRequest.currentQuantity) {
      return res.status(409).json({
        success: false,
        message: `Stock quantity has changed since this request was made (was ${editRequest.currentQuantity}, now ${liveQuantity}). Please reject and ask manager to resubmit.`,
      });
    }

    // Stock update
    if (stock) {
      stock.quantity = editRequest.requestedQuantity;
      await stock.save();
    } else {
      stock = await Stock.create({
        productId: editRequest.productId,
        quantity: editRequest.requestedQuantity,
      });
    }

    // Product cost snapshot (transaction record အတွက်)
    const Product = getCentralProductModel();
    const productData = await Product.findById(editRequest.productId);
    const currentCost = productData?.cost || 0;
    const currentSupplier = productData?.shopName || "Unknown Supplier";

    // Transaction history မှတ်တမ်းတင်ခြင်း
    const StockTransaction = getCentralStockTransactionModel();
    await StockTransaction.create({
      productId: editRequest.productId,
      branchId: editRequest.branchId,
      transactionType: "ADJUSTMENT",
      quantity: editRequest.changeAmount, // + or - value, direction ကို ပြသည်
      unitCost: currentCost,
      supplierName: currentSupplier,
      totalAmount: currentCost * Math.abs(editRequest.changeAmount),
      performedBy: reviewedBy || "Admin",
      notes: `[Manager Request Approved] ${editRequest.reason}`,
    });

    // Request status update
    editRequest.status = "APPROVED";
    editRequest.reviewedBy = reviewedBy || "Admin";
    editRequest.reviewedAt = new Date();
    editRequest.adminNote = adminNote || "";
    await editRequest.save();

    return res.status(200).json({
      success: true,
      data: stock,
      request: editRequest,
      message: "Stock edit request approved and stock updated successfully",
    });
  } catch (error: any) {
    console.error("❌ Approve Stock Edit Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// 🌟 Admin: Request ကို Reject လုပ်ခြင်း (Stock ဘာမှ မပြောင်းပါ)
export const rejectStockEditRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewedBy, adminNote } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request ID" });
    }

    const StockEditRequest = getCentralStockEditRequestModel();
    const editRequest = await StockEditRequest.findById(id);

    if (!editRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }
    if (editRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${editRequest.status.toLowerCase()}`,
      });
    }

    editRequest.status = "REJECTED";
    editRequest.reviewedBy = reviewedBy || "Admin";
    editRequest.reviewedAt = new Date();
    editRequest.adminNote = adminNote || "";
    await editRequest.save();

    return res.status(200).json({
      success: true,
      data: editRequest,
      message: "Stock edit request rejected",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
