import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getCentralProductModel } from "../models/CentralDB/products";
import { getCentralSaleSummaryModel } from "../models/CentralDB/saleSummary";
import { getBranchConnection } from "../db/db";
import { getSaleModel } from "../models/BranchDB/sale";
import { getBranchStockModel } from "../models/BranchDB/stock";
import { ISaleItem, ISale } from "../models/BranchDB/sale";

const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

const ALLOWED_PAYMENT_METHODS: ISale["paymentMethod"][] = [
  "cash",
  "kbz_pay",
  "wave_pay",
  "card",
  "other",
];

// req.body.paymentMethod arrives as a plain string — narrow it to the
// schema's literal union (or fall back to "cash") instead of casting blindly.
const resolvePaymentMethod = (value: unknown): ISale["paymentMethod"] => {
  if (
    typeof value === "string" &&
    ALLOWED_PAYMENT_METHODS.includes(value as ISale["paymentMethod"])
  ) {
    return value as ISale["paymentMethod"];
  }
  return "cash";
};

// Same dual-purpose resolver used in inventory.ts — accepts either a real
// ObjectId (admin dashboard) or a branch name string (manager/cashier,
// since req.user.branch stores the name from the JWT payload).
const resolveBranch = async (branchIdOrName: string) => {
  const Branch = getCentralBranchModel();
  if (isValidObjectId(branchIdOrName)) {
    return await Branch.findById(branchIdOrName);
  }
  return await Branch.findOne({ name: branchIdOrName });
};

// ============================================================
// POST /api/sales  — Cashier (or Manager) records a sale
// ============================================================
export const createSale = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, paymentMethod, discountType, discountValue, taxRate } =
      req.body as {
        items: { productId: string; quantity: number }[];
        paymentMethod?: string;
        discountType?: string;
        discountValue?: number;
        taxRate?: number;
      };

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    for (const item of items) {
      if (!item.productId || !isValidObjectId(item.productId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Product ID in items",
        });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Each item quantity must be greater than 0",
        });
      }
    }

    const resolvedDiscountType: "amount" | "percent" =
      discountType === "percent" ? "percent" : "amount";
    const resolvedDiscountValue = Number(discountValue) || 0;
    const resolvedTaxRate = Number(taxRate) || 0;

    if (resolvedDiscountValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value cannot be negative",
      });
    }
    if (resolvedDiscountType === "percent" && resolvedDiscountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Discount percent cannot exceed 100",
      });
    }
    if (resolvedTaxRate < 0 || resolvedTaxRate > 100) {
      return res.status(400).json({
        success: false,
        message: "Tax rate must be between 0 and 100",
      });
    }

    // req.user.branch stores the branch NAME (see authMiddleware)
    const branch = await resolveBranch(req.user.branch);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found in Central Database",
      });
    }

    const branchDb = getBranchConnection(branch.dbName);
    const Sale = getSaleModel(branchDb);
    const Stock = getBranchStockModel(branchDb);
    const Product = getCentralProductModel();

    // 1) Price snapshot from CentralDB + stock availability check for every item
    //    (checked up-front so we don't deduct half the cart before failing)
    const saleItems = [];
    for (const item of items) {
      const productData = await Product.findById(item.productId);
      if (!productData) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      const stock = await Stock.findOne({
        productId: new mongoose.Types.ObjectId(item.productId),
      });

      if (!stock || stock.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for "${productData.name}". Available: ${stock?.quantity ?? 0}`,
        });
      }

      saleItems.push({
        productId: new mongoose.Types.ObjectId(item.productId),
        name: productData.name,
        quantity: item.quantity,
        price: productData.price,
      });
    }

    const subtotal = saleItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );

    // Discount is resolved to a Ks amount and clamped so it can never exceed
    // the subtotal (e.g. a stray 999999 flat-amount discount, or float drift
    // on a percent discount) — total can never go negative.
    let discountAmount =
      resolvedDiscountType === "percent"
        ? Math.round((subtotal * resolvedDiscountValue) / 100)
        : Math.round(resolvedDiscountValue);
    discountAmount = Math.min(Math.max(discountAmount, 0), subtotal);

    const taxableAmount = subtotal - discountAmount;
    const taxAmount = Math.round((taxableAmount * resolvedTaxRate) / 100);
    const totalAmount = taxableAmount + taxAmount;

    // 2) Deduct stock for every item (up-front check above makes this safe)
    for (const item of items) {
      await Stock.updateOne(
        { productId: new mongoose.Types.ObjectId(item.productId) },
        { $inc: { quantity: -item.quantity } },
      );
    }

    // 3) Write the Sale — BranchDB is the source of truth
    const saleNumber = `SALE-${branch.code}-${Date.now()}`;

    const sale = await Sale.create({
      saleNumber,
      cashierId: req.user.id,
      cashierName: req.user.name,
      items: saleItems,
      subtotal,
      discountType: resolvedDiscountType,
      discountValue: resolvedDiscountValue,
      discountAmount,
      taxRate: resolvedTaxRate,
      taxAmount,
      totalAmount,
      paymentMethod: resolvePaymentMethod(paymentMethod),
      status: "completed",
    });

    // 4) Dual-write a lightweight summary to CentralDB so Admin can filter
    //    by branch in real time without querying every branch DB.
    const SaleSummary = getCentralSaleSummaryModel();
    await SaleSummary.create({
      branchId: branch._id,
      branchName: branch.name,
      saleId: sale._id,
      saleNumber: sale.saleNumber,
      cashierId: req.user.id,
      cashierName: req.user.name,
      itemCount: saleItems.length,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      paymentMethod: sale.paymentMethod,
      status: "completed",
    });

    return res.status(201).json({
      success: true,
      message: "Sale recorded successfully",
      data: sale,
    });
  } catch (error: any) {
    console.error("❌ Create Sale Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// ============================================================
// GET /api/sales/mine — Cashier: only their own sales, own branch
// ============================================================
export const getMySales = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const branch = await resolveBranch(req.user.branch);
    if (!branch) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }

    const branchDb = getBranchConnection(branch.dbName);
    const Sale = getSaleModel(branchDb);

    const sales = await Sale.find({ cashierId: req.user.id }).sort({
      createdAt: -1,
    });

    const totalToday = sales
      .filter((s) => isToday(s.createdAt) && s.status === "completed")
      .reduce((sum, s) => sum + s.totalAmount, 0);

    return res.status(200).json({
      success: true,
      data: sales,
      totalToday,
    });
  } catch (error: any) {
    console.error("❌ Get My Sales Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET /api/sales/branch — Manager: every sale in their own branch
// (Admin can also call this with ?branchId= to inspect one branch)
// ============================================================
export const getBranchSales = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const branchIdOrName =
      req.user.role === "admin" && req.query.branchId
        ? (req.query.branchId as string)
        : req.user.branch;

    const branch = await resolveBranch(branchIdOrName);
    if (!branch) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }

    const branchDb = getBranchConnection(branch.dbName);
    const Sale = getSaleModel(branchDb);

    const filter: any = {};
    if (req.query.cashierId) filter.cashierId = req.query.cashierId;
    if (req.query.status) filter.status = req.query.status;

    const sales = await Sale.find(filter).sort({ createdAt: -1 });

    const totalRevenue = sales
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.totalAmount, 0);

    return res.status(200).json({
      success: true,
      data: sales,
      totalRevenue,
      branchName: branch.name,
    });
  } catch (error: any) {
    console.error("❌ Get Branch Sales Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET /api/sales/overview — Admin: all branches, filterable by branchId
// Reads from CentralDB SaleSummary (no need to touch every branch DB)
// ============================================================
export const getSalesOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { branchId, startDate, endDate } = req.query;

    const filter: any = {};

    if (branchId) {
      const branch = await resolveBranch(branchId as string);
      if (branch) filter.branchId = branch._id;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const SaleSummary = getCentralSaleSummaryModel();
    const summaries = await SaleSummary.find(filter).sort({ createdAt: -1 });

    const totalRevenue = summaries
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.totalAmount, 0);

    // Per-branch breakdown — handy for an admin dashboard chart
    const byBranch: Record<string, { branchName: string; total: number; count: number }> = {};
    for (const s of summaries) {
      if (s.status !== "completed") continue;
      const key = s.branchId.toString();
      if (!byBranch[key]) {
        byBranch[key] = { branchName: s.branchName, total: 0, count: 0 };
      }
      byBranch[key].total += s.totalAmount;
      byBranch[key].count += 1;
    }

    return res.status(200).json({
      success: true,
      data: summaries,
      totalRevenue,
      byBranch: Object.values(byBranch),
    });
  } catch (error: any) {
    console.error("❌ Get Sales Overview Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// POST /api/sales/:id/void — Manager/Admin: void a sale & restock items
// ============================================================
export const voidSale = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const branchIdOrName =
      req.user.role === "admin" && req.body.branchId
        ? req.body.branchId
        : req.user.branch;

    const branch = await resolveBranch(branchIdOrName);
    if (!branch) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }

    const branchDb = getBranchConnection(branch.dbName);
    const Sale = getSaleModel(branchDb);
    const Stock = getBranchStockModel(branchDb);

    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale not found" });
    }
    if (sale.status === "voided") {
      return res.status(400).json({ success: false, message: "Sale is already voided" });
    }

    // restock every item from the voided sale
    for (const item of sale.items) {
      await Stock.updateOne(
        { productId: item.productId },
        { $inc: { quantity: item.quantity } },
      );
    }

    sale.status = "voided";
    sale.voidedReason = reason || "";
    await sale.save();

    // keep CentralDB summary in sync
    const SaleSummary = getCentralSaleSummaryModel();
    await SaleSummary.updateOne({ saleId: sale._id }, { status: "voided" });

    return res.status(200).json({
      success: true,
      message: "Sale voided and stock restored",
      data: sale,
    });
  } catch (error: any) {
    console.error("❌ Void Sale Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

function isToday(date: Date): boolean {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}