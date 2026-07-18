import { Request, Response } from "express";
import mongoose from "mongoose";
import { Model } from "mongoose";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getCentralTransferModel } from "../models/CentralDB/transfers";
import { getCentralProductModel } from "../models/CentralDB/products";
import { getBranchConnection } from "../db/db";
import { getBranchStockModel } from "../models/BranchDB/stock";
import { ITransfer } from "../models/CentralDB/transfers";

export const getProductsForTransfer = async (req: Request, res: Response) => {
  try {
    let { branchName, search } = req.query;

    if (!branchName) {
      return res.status(400).json({
        success: false,
        message: "ကျေးဇူးပြု၍ ဆိုင်ခွဲအမည် (Branch Name) ထည့်သွင်းပေးပါရန်။",
      });
    }

    const Branch = getCentralBranchModel();
    const branch = await Branch.findOne({ name: branchName as string });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "တောင်းဆိုထားသော ဆိုင်ခွဲအချက်အလက် ရှာမတွေ့ပါ။",
      });
    }

    const dbIdentifier = branch.code;
    const branchDb = getBranchConnection(
      `branch_${dbIdentifier.toLowerCase()}`,
    );
    const Product = getCentralProductModel();

    const Stock = getBranchStockModel(branchDb);

    console.log("Branch DB Name:", branchDb.name);
    // သေချာအောင် connection ကို explicit ပေးပါ
    const availableStocks = await Stock.find({
      quantity: { $gt: 0 },
    }).setOptions({ connection: branchDb });

    console.log("Available Stocks Result:", availableStocks);

    // 🌟 အဆင့် (၃) - Data format စစ်ရန် (Product ID ပါ မပါ)
    if (availableStocks.length > 0) {
      console.log("Sample Stock Object:", JSON.stringify(availableStocks[0]));
    }

    const availableProductIds = availableStocks.map((stock) => stock.productId);
    console.log("Extracted IDs:", availableProductIds);

    if (availableProductIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const filter: any = {
      status: "active",
      _id: { $in: availableProductIds },
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter).sort({ name: 1 });

    // (Optional) Product အချက်အလက်နဲ့အတူ လက်ကျန် Stock အရေအတွက်ကိုပါ တစ်ပါတည်း တွဲပို့ပေးချင်တယ်ဆိုရင်
    const productsWithStock = products.map((product) => {
      const stockInfo = availableStocks.find(
        (s) => s.productId.toString() === product._id.toString(),
      );
      return {
        ...product.toObject(),
        availableQuantity: stockInfo ? stockInfo.quantity : 0,
      };
    });

    return res.status(200).json({
      success: true,
      data: productsWithStock, // Stock အရေအတွက်ပါ ပူးတွဲပါသွားမည်
    });
  } catch (error: any) {
    console.error("Get products for transfer error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// ၁။ Product တစ်ခုချင်းစီအတွက် ဆိုင်ခွဲအားလုံးမှာရှိတဲ့ Stock တွေကို လှမ်းကြည့်ရန်
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
    const activeBranches = await Branch.find({ status: "active" });

    const rawStockDetails = await Promise.all(
      activeBranches.map(async (branch) => {
        try {
          // 🌟 အရေးကြီး: အရင်က ပြင်ထားတဲ့ branch_code logic အတိုင်းပဲ သုံးပေးပါ
          // ဥပမာ - branch.code ကို သုံးပြီး connection တည်ဆောက်ခြင်း
          const branchDb = getBranchConnection(
            `branch_${branch.code.toLowerCase()}`,
          );
          const Stock = getBranchStockModel(branchDb);

          const stockDoc = await Stock.findOne({
            productId: new mongoose.Types.ObjectId(productId),
          });

          // အကယ်၍ Stock မရှိရင် သို့မဟုတ် quantity က 0 ဆိုရင် null ပြန်ပေးမယ်
          if (!stockDoc || stockDoc.quantity <= 0) {
            return null;
          }

          return {
            branchId: branch._id,
            branchName: branch.name,
            branchCode: branch.code,
            quantity: stockDoc.quantity,
            status: stockDoc.status,
          };
        } catch (dbErr) {
          console.error(`Error connecting to ${branch.name}:`, dbErr);
          return null; // Connection Error တက်တဲ့ Branch တွေကိုလည်း ဖယ်ထုတ်လိုက်မယ်
        }
      }),
    );

    // 🌟 Null ဖြစ်နေတဲ့ Branch တွေကို ဖယ်ထုတ်ပြီး Data သန့်သန့်ပဲ ရယူမယ်
    const stockDetails = rawStockDetails.filter((item) => item !== null);

    return res.status(200).json({
      success: true,
      data: stockDetails,
    });
  } catch (error: any) {
    console.error("Get stock across branches error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ၂။ Transfer Request အသစ်တင်ခြင်း (Name ဖြင့် ရှာဖွေပြီး အလုပ်လုပ်မည်)
export const createTransferRequest = async (req: Request, res: Response) => {
  try {
    const { fromBranch, toBranch, productId, quantity, requestedBy } = req.body;

    if (!fromBranch || !toBranch || !productId || !quantity || !requestedBy) {
      return res
        .status(400)
        .json({ success: false, message: "Required fields are missing" });
    }

    const Branch = getCentralBranchModel();
    const Transfer = getCentralTransferModel();

    // Branch အမည်ဖြင့် ရှာဖွေခြင်း
    const sourceBranch = await Branch.findOne({ name: fromBranch });
    const targetBranch = await Branch.findOne({ name: toBranch });

    if (!sourceBranch)
      return res
        .status(404)
        .json({ success: false, message: "Source branch not found" });

    if (!targetBranch)
      return res
        .status(404)
        .json({ success: false, message: "Target branch not found" });

    // 🌟 အရေးကြီး: Source Branch DB ကို ချိတ်ဆက်ရာတွင် Prefix နှင့် Lowercase Logic သုံးပါ
    // (မှတ်ချက်: sourceBranch.code သို့မဟုတ် sourceBranch.dbName - သင့် Model မှာသုံးထားတာကို ပြင်ပေးပါ)
    const fromBranchDb = getBranchConnection(
      `branch_${sourceBranch.code.toLowerCase()}`,
    );

    const FromStock = getBranchStockModel(fromBranchDb);

    const sourceStock = await FromStock.findOne({
      productId: new mongoose.Types.ObjectId(productId),
    });

    // Stock စစ်ဆေးခြင်း
    if (!sourceStock || sourceStock.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `ပစ္စည်းမလုံလောက်ပါ။ လက်ကျန် stock အရေအတွက်မှာ ${sourceStock ? sourceStock.quantity : 0} ခုသာရှိပါသည်။`,
      });
    }

    // Transfer Request တင်ခြင်း
    const newTransfer = await Transfer.create({
      fromBranchId: sourceBranch._id,
      toBranchId: targetBranch._id,
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
    console.error("Create transfer request error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ၃။ Super Admin မှ ပစ္စည်းလွှဲပြောင်းမှုကို အတည်ပြုခြင်း (Approve)
export const approveTransferRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const Transfer = getCentralTransferModel() as Model<ITransfer>;
    const Branch = getCentralBranchModel();

    const transferDoc = await Transfer.findById(id);
    if (!transferDoc)
      return res
        .status(404)
        .json({ success: false, message: "Transfer request not found" });
    if (transferDoc.status !== "pending") {
      return res.status(400).json({
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

    const sourceStock = await FromStock.findOne({
      productId: transferDoc.productId as any,
    });
    if (!sourceStock || sourceStock.quantity < transferDoc.quantity) {
      return res.status(400).json({
        success: false,
        message: "Source branch has insufficient stock now",
      });
    }

    sourceStock.quantity -= transferDoc.quantity;
    await sourceStock.save();

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
      return res.status(400).json({
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
