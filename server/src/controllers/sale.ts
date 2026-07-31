import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getCentralSaleSummaryModel } from "../models/CentralDB/saleSummary";
import { getCentralReturnSummaryModel } from "../models/CentralDB/returnSummary";
import { getBranchConnection } from "../db/db";
import { getSaleModel } from "../models/BranchDB/sale";
import { getReturnModel } from "../models/BranchDB/return";
import { getBranchStockModel } from "../models/BranchDB/stock";
import { ISaleItem, ISale } from "../models/BranchDB/sale";
import { getEffectiveDiscountCap } from "../utils/discountCap";
import {
  priceAndValidateItems,
  deductStockForItems,
  computeDiscountAndTax,
} from "../utils/salePricing";
import { attachReturnInfo } from "../utils/returnInfo";
import { getCentralCustomerModel } from "../models/CentralDB/customer";
import { validateCoupon, recordCustomerPurchase } from "../utils/membership";

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
    const {
      items,
      paymentMethod,
      discountType,
      discountValue,
      taxRate,
      linkedReturnId,
      customerId,
      couponCode,
    } = req.body as {
      items: { productId: string; quantity: number }[];
      paymentMethod?: string;
      discountType?: string;
      discountValue?: number;
      taxRate?: number;
      linkedReturnId?: string;
      customerId?: string;
      couponCode?: string;
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

    // Optional: attach this sale to a known customer for purchase tracking
    let customer = null;
    if (customerId) {
      if (!isValidObjectId(customerId)) {
        return res.status(400).json({ success: false, message: "Invalid customer ID" });
      }
      const Customer = getCentralCustomerModel();
      customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }
    }

    // Optional: a coupon can only be redeemed against the customer it was
    // issued to — reject it up-front rather than silently ignoring it
    if (couponCode && !customer) {
      return res.status(400).json({
        success: false,
        message: "A customer must be selected to use a coupon",
      });
    }

    let linkedReturn = null;
    if (linkedReturnId) {
      const Return = getReturnModel(branchDb);
      linkedReturn = isValidObjectId(linkedReturnId)
        ? await Return.findById(linkedReturnId)
        : await Return.findOne({ returnNumber: linkedReturnId });
      if (!linkedReturn) {
        return res.status(404).json({ success: false, message: "Linked return not found" });
      }
      if (linkedReturn.type !== "exchange") {
        return res.status(400).json({
          success: false,
          message: "That return isn't marked as an exchange",
        });
      }
      if (linkedReturn.exchangeSaleId) {
        return res.status(400).json({
          success: false,
          message: "This return has already been linked to a sale",
        });
      }
    }

    // 1) Price snapshot from CentralDB + stock availability check for every
    //    item (checked up-front so we don't deduct half the cart before failing)
    const priced = await priceAndValidateItems(items, branchDb);
    if (!priced.ok) {
      return res.status(priced.status).json({ success: false, message: priced.message });
    }
    const saleItems = priced.items;
    const { discountAmount, taxAmount, totalAmount } = computeDiscountAndTax(
      priced.subtotal,
      resolvedDiscountType,
      resolvedDiscountValue,
      resolvedTaxRate,
    );
    const subtotal = priced.subtotal;

    if (subtotal > 0) {
      const { capPercent, source, eventName } = await getEffectiveDiscountCap(
        req.user.role,
        branch._id,
      );
      const effectiveDiscountPercent = (discountAmount / subtotal) * 100;

      if (effectiveDiscountPercent > capPercent + 0.01) {
        // Over cap — this can't go through as a direct sale. The frontend
        // should submit a POST /api/discount-approval-requests instead,
        // which routes it to a manager or admin for approval (see
        // controllers/discountApprovalRequest.ts).
        const limitLabel =
          source === "event"
            ? `${capPercent}% (${eventName})`
            : `${capPercent}%`;
        return res.status(400).json({
          success: false,
          message: `Discount exceeds your limit of ${limitLabel} for this sale`,
          requiresApproval: true,
        });
      }
    }

    // 1b) Coupon — validated against the customer, NOT counted toward the
    //     cashier/manager discount cap above (it's a system-issued reward
    //     from a controlled source, not cashier discretion). It reduces the
    //     total on top of any manual discount, clamped so total never goes negative.
    let couponDiscountAmount = 0;
    let redeemedCoupon = null;
    if (couponCode && customer) {
      const couponResult = await validateCoupon(couponCode, customer.id);
      if (!couponResult.ok) {
        return res.status(400).json({ success: false, message: couponResult.message });
      }
      redeemedCoupon = couponResult.coupon;
      const rawCouponDiscount =
        redeemedCoupon.discountType === "percent"
          ? Math.round((subtotal * redeemedCoupon.discountValue) / 100)
          : Math.round(redeemedCoupon.discountValue);
      couponDiscountAmount = Math.min(Math.max(rawCouponDiscount, 0), totalAmount);
    }
    const finalTotalAmount = totalAmount - couponDiscountAmount;

    // 2) Deduct stock for every item (up-front check above makes this safe)
    await deductStockForItems(saleItems, branchDb);

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
      totalAmount: finalTotalAmount,
      paymentMethod: resolvePaymentMethod(paymentMethod),
      status: "completed",
      ...(customer ? { customerId: customer._id } : {}),
      ...(redeemedCoupon
        ? { couponCode: redeemedCoupon.code, couponDiscountAmount }
        : {}),
      ...(linkedReturn
        ? {
            linkedReturnId: linkedReturn._id,
            linkedReturnNumber: linkedReturn.returnNumber,
          }
        : {}),
    });

    // 3b) Redeeming a coupon and updating customer purchase stats are
    //     best-effort follow-ups — the sale itself already committed and
    //     stock already moved, so a failure here shouldn't roll any of
    //     that back or fail the whole request.
    if (redeemedCoupon) {
      try {
        redeemedCoupon.status = "used";
        redeemedCoupon.usedInSaleId = sale._id as mongoose.Types.ObjectId;
        redeemedCoupon.usedAt = new Date();
        await redeemedCoupon.save();
      } catch (couponErr) {
        console.error("⚠️ Failed to mark coupon used:", couponErr);
      }
    }
    if (customer) {
      try {
        await recordCustomerPurchase(customer.id, finalTotalAmount);
      } catch (custErr) {
        console.error("⚠️ Failed to update customer purchase stats:", custErr);
      }
    }

    if (linkedReturn) {
      linkedReturn.exchangeSaleId = sale._id as mongoose.Types.ObjectId;
      await linkedReturn.save();
    }

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
      totalAmount: finalTotalAmount,
      paymentMethod: sale.paymentMethod,
      status: "completed",
      ...(customer ? { customerId: customer._id } : {}),
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
// GET /api/sales/:id — full sale with line items (for a
// receipt view / "what did this sale contain" drill-down).
// Admin: pass ?branchId= (SaleSummary rows carry it already).
// Manager/Cashier: scoped to their own branch automatically.
// ============================================================
export const getSaleDetail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const id = req.params.id;
    if (!id || typeof id !== "string" || !isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid Sale ID" });
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

    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale not found" });
    }

    // Cashiers may only drill into their own sales
    if (req.user.role === "cashier" && sale.cashierId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return res.status(200).json({
      success: true,
      data: sale,
      branchName: branch.name,
    });
  } catch (error: any) {
    console.error("❌ Get Sale Detail Error:", error);
    return res.status(500).json({ success: false, message: error.message });
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

    const enriched = await attachReturnInfo(sales, branchDb);

    return res.status(200).json({
      success: true,
      data: enriched,
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

    const grossRevenue = sales
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const Return = getReturnModel(branchDb);
    const returns = await Return.find();
    const totalRefunded = returns.reduce((sum, r) => sum + r.refundAmount, 0);

    const totalRevenue = grossRevenue - totalRefunded;

    const enriched = await attachReturnInfo(sales, branchDb);

    return res.status(200).json({
      success: true,
      data: enriched,
      totalRevenue,
      totalRefunded,
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

    const grossRevenue = summaries
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.totalAmount, 0);

    // Returns aren't tagged with a "status" (there's no voided-equivalent
    // for a return), so the same branchId/date filter applies as-is.
    const ReturnSummary = getCentralReturnSummaryModel();
    const returnSummaries = await ReturnSummary.find(filter);
    const totalRefunded = returnSummaries.reduce((sum, r) => sum + r.refundAmount, 0);

    const totalRevenue = grossRevenue - totalRefunded;

    const refundByBranch: Record<string, number> = {};
    for (const r of returnSummaries) {
      const key = r.branchId.toString();
      refundByBranch[key] = (refundByBranch[key] || 0) + r.refundAmount;
    }

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
    for (const key of Object.keys(byBranch)) {
      const entry = byBranch[key];
      if (entry) entry.total -= refundByBranch[key] || 0;
    }

    return res.status(200).json({
      success: true,
      data: summaries,
      totalRevenue,
      totalRefunded,
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