import { Request, Response } from "express";
import mongoose from "mongoose";
import { Model } from "mongoose";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getCentralTransferModel } from "../models/CentralDB/transfers";
import { getCentralProductModel } from "../models/CentralDB/products";
import { getBranchConnection } from "../db/db";
import { getBranchStockModel } from "../models/BranchDB/stock";
import { ITransfer } from "../models/CentralDB/transfers";

// ၁။ Product တစ်ခုချင်းစီအတွက် ဆိုင်ခွဲအားလုံးမှာရှိတဲ့ Stock တွေကို လှမ်းကြည့်ရန် (Read-Only)
export const getProductStockAcrossBranches = async (
  req: Request,
  res: Response,
) => {
  try {
    const { productId } = req.params;

    if (!productId || typeof productId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing Request ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product ID format" });
    }

    const Branch = getCentralBranchModel();
    // active ဖြစ်နေတဲ့ ဆိုင်ခွဲအားလုံးကို ဆွဲယူမည်
    const activeBranches = await Branch.find({ status: "active" });

    const stockDetails = await Promise.all(
      activeBranches.map(async (branch) => {
        try {
          const branchDb = getBranchConnection(branch.dbName);
          const Stock = getBranchStockModel(branchDb);
          const stockDoc = await Stock.findOne({
            productId: new mongoose.Types.ObjectId(productId),
          });

          return {
            branchId: branch._id,
            branchName: branch.name,
            branchCode: branch.code,
            quantity: stockDoc ? stockDoc.quantity : 0,
            status: stockDoc ? stockDoc.status : "Out of Stock",
          };
        } catch (dbErr) {
          // တကယ်လို့ ဆိုင်ခွဲတစ်ခုခုရဲ့ Database ဒေါင်းနေရင် Error မတက်ဘဲ 0 ပြပေးရန်
          return {
            branchId: branch._id,
            branchName: branch.name,
            branchCode: branch.code,
            quantity: 0,
            status: "Connection Error",
          };
        }
      }),
    );

    return res.status(200).json({ success: true, data: stockDetails });
  } catch (error: any) {
    console.error("Get stock across branches error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ၂။ Transfer Request အသစ်တင်ခြင်း (သယ်ယူမည့်ဆိုင်တွင် Stock ရှိမရှိ စစ်ဆေးမည်)
export const createTransferRequest = async (req: Request, res: Response) => {
  try {
    const { fromBranchId, toBranchId, productId, quantity, requestedBy } =
      req.body;

    if (
      !fromBranchId ||
      !toBranchId ||
      !productId ||
      !quantity ||
      !requestedBy
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Required fields are missing" });
    }

    const Branch = getCentralBranchModel();
    const Transfer = getCentralTransferModel();

    // ပစ္စည်းထုတ်ပေးမည့် (From Branch) ဆိုင်ကို ရှာဖွေခြင်း
    const fromBranch = await Branch.findById(fromBranchId);
    if (!fromBranch)
      return res
        .status(404)
        .json({ success: false, message: "Source branch not found" });

    // From Branch တွင် ပစ္စည်းအမှန်တကယ် လုံလောက်မှုရှိမရှိ စစ်ဆေးခြင်း
    const fromBranchDb = getBranchConnection(fromBranch.dbName);
    const FromStock = getBranchStockModel(fromBranchDb);
    const sourceStock = await FromStock.findOne({
      productId: new mongoose.Types.ObjectId(productId),
    });

    if (!sourceStock || sourceStock.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `ပစ္စည်းမလုံလောက်ပါ။ လက်ကျန် stock အရေအတွက်မှာ ${sourceStock ? sourceStock.quantity : 0} ခုသာရှိပါသည်။`,
      });
    }

    // Request ဖန်တီးခြင်း
    const newTransfer = await Transfer.create({
      fromBranchId,
      toBranchId,
      productId,
      quantity: Number(quantity),
      requestedBy,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message:
        "ပစ္စည်းလွှဲပြောင်းရန် တောင်းဆိုမှုအောင်မြင်ပါသည်။ Admin အတည်ပြုချက်ကို စောင့်ဆိုင်းနေပါသည်။",
      data: newTransfer,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ၃။ Super Admin မှ ပစ္စည်းလွှဲပြောင်းမှုကို အတည်ပြုခြင်း (Approve)
export const approveTransferRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body; // အတည်ပြုသူ အမည်

    const Transfer = getCentralTransferModel() as Model<ITransfer>;
    const Branch = getCentralBranchModel();

    const transferDoc = await Transfer.findById(id);
    if (!transferDoc)
      return res
        .status(404)
        .json({ success: false, message: "Transfer request not found" });
    if (transferDoc.status !== "pending") {
      return res
        .status(400)
        .json({
          success: false,
          message: "This request has already been processed",
        });
    }

    const fromBranch = await Branch.findById(transferDoc.fromBranchId);
    const toBranch = await Branch.findById(transferDoc.toBranchId);

    if (!fromBranch || !toBranch) {
      return res
        .status(404)
        .json({ success: false, message: "Branches not found" });
    }

    const fromDb = getBranchConnection(fromBranch.dbName);
    const toDb = getBranchConnection(toBranch.dbName);

    const FromStock = getBranchStockModel(fromDb);
    const ToStock = getBranchStockModel(toDb);

    // From Branch ဆိုင်မှ Stock ကို နုတ်ခြင်း
    const sourceStock = await FromStock.findOne({
      productId: transferDoc.productId as any,
    });
    if (!sourceStock || sourceStock.quantity < transferDoc.quantity) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Source branch has insufficient stock now",
        });
    }

    sourceStock.quantity -= transferDoc.quantity;
    await sourceStock.save();

    // To Branch ဆိုင်ထဲသို့ Stock ပေါင်းထည့်ခြင်း
    let destStock = await ToStock.findOne({
      productId: transferDoc.productId as any,
    });
    if (destStock) {
      destStock.quantity += transferDoc.quantity;
      await destStock.save();
    } else {
      await ToStock.create({
        productId: transferDoc.productId as any,
        quantity: transferDoc.quantity,
      });
    }

    // Status အား Approved သို့ ပြောင်းလဲခြင်း
    transferDoc.status = "approved";
    transferDoc.approvedBy = approvedBy;
    await transferDoc.save();

    return res.status(200).json({
      success: true,
      message:
        "ပစ္စည်းလွှဲပြောင်းမှုကို အောင်မြင်စွာ အတည်ပြုပြီးပါပြီ။ Stock များ Update ဖြစ်သွားပါပြီ။",
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ၄။ Request ကို ပယ်ချခြင်း (Reject)
export const rejectTransferRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const Transfer = getCentralTransferModel() as Model<ITransfer>;

    const transferDoc = await Transfer.findById(id);

    if (!transferDoc)
      return res
        .status(404)
        .json({ success: false, message: "Transfer request not found" });
    if (transferDoc.status !== "pending") {
      return res
        .status(400)
        .json({
          success: false,
          message: "This request has already been processed",
        });
    }

    transferDoc.status = "rejected";
    transferDoc.approvedBy = approvedBy;
    await transferDoc.save();

    return res
      .status(200)
      .json({ success: true, message: "တောင်းဆိုမှုကို ပယ်ချလိုက်ပါသည်။" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ၅။ Transfer List အားလုံး ဆွဲထုတ်ခြင်း
export const getTransfers = async (req: Request, res: Response) => {
  try {
    const Transfer = getCentralTransferModel();
    // Population သုံးပြီး Branch နှင့် Product အမည်များကို တစ်ပါတည်းဆွဲထုတ်မည်
    const transfers = await Transfer.find()
      .populate("fromBranchId", "name code")
      .populate("toBranchId", "name code")
      .populate("productId", "name sku image")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: transfers });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
