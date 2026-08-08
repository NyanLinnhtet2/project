import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getBranchConnection } from "../db/db";
import { getSaleModel } from "../models/BranchDB/sale";
import { getReturnModel } from "../models/BranchDB/return";
import { getCentralReturnSummaryModel } from "../models/CentralDB/returnSummary";
import { restockItems } from "../utils/salePricing";

const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

const resolveBranch = async (branchIdOrName: string) => {
  const Branch = getCentralBranchModel();
  if (isValidObjectId(branchIdOrName)) {
    return await Branch.findById(branchIdOrName);
  }
  return await Branch.findOne({ name: branchIdOrName });
};


export const createReturn = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { originalSaleId, items, reason, type, branchId } = req.body as {
      originalSaleId: string;
      items: { productId: string; quantity: number }[];
      reason?: string;
      type?: "return" | "exchange";
      branchId?: string; // admin only, to pick which branch's sale this is
    };

    if (!originalSaleId || !isValidObjectId(originalSaleId)) {
      return res.status(400).json({ success: false, message: "Invalid original sale ID" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item to return is required",
      });
    }
    for (const item of items) {
      if (!item.productId || !isValidObjectId(item.productId)) {
        return res.status(400).json({ success: false, message: "Invalid Product ID in items" });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Each item quantity must be greater than 0",
        });
      }
    }
    const resolvedType: "return" | "exchange" = type === "exchange" ? "exchange" : "return";

    const branchIdOrName =
      req.user.role === "admin" && branchId ? branchId : req.user.branch;
    const branch = await resolveBranch(branchIdOrName);
    if (!branch) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }

    const branchDb = getBranchConnection(branch.dbName);
    const Sale = getSaleModel(branchDb);
    const Return = getReturnModel(branchDb);

    const sale = await Sale.findById(originalSaleId);
    if (!sale) {
      return res.status(404).json({ success: false, message: "Original sale not found" });
    }
    if (sale.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot return items from a voided sale",
      });
    }

    
    const priorReturns = await Return.find({ originalSaleId: sale._id });
    const alreadyReturnedByProduct = new Map<string, number>();
    for (const priorReturn of priorReturns) {
      for (const line of priorReturn.items) {
        const key = line.productId.toString();
        alreadyReturnedByProduct.set(
          key,
          (alreadyReturnedByProduct.get(key) || 0) + line.quantity,
        );
      }
    }

    const discountFraction = sale.subtotal > 0 ? sale.discountAmount / sale.subtotal : 0;
    const taxMultiplier = 1 + sale.taxRate / 100;

    const returnItems: {
      productId: mongoose.Types.ObjectId;
      name: string;
      category: string;
      brand: string;
      quantity: number;
      price: number;
      refundAmount: number;
    }[] = [];

    for (const requested of items) {
      const saleLine = sale.items.find(
        (i) => i.productId.toString() === requested.productId,
      );
      if (!saleLine) {
        return res.status(400).json({
          success: false,
          message: `Product ${requested.productId} was not part of this sale`,
        });
      }

      const alreadyReturned = alreadyReturnedByProduct.get(requested.productId) || 0;
      const availableToReturn = saleLine.quantity - alreadyReturned;
      if (requested.quantity > availableToReturn) {
        return res.status(400).json({
          success: false,
          message: `Cannot return ${requested.quantity} of "${saleLine.name}" — only ${availableToReturn} available to return (${alreadyReturned} already returned)`,
        });
      }

      const perUnitAfterDiscount = saleLine.price * (1 - discountFraction);
      const perUnitFinal = perUnitAfterDiscount * taxMultiplier;
      const lineRefund = Math.round(perUnitFinal * requested.quantity);

      returnItems.push({
        productId: saleLine.productId,
        name: saleLine.name,
        category: saleLine.category,
        brand: saleLine.brand,
        quantity: requested.quantity,
        price: saleLine.price,
        refundAmount: lineRefund,
      });
    }

    const refundAmount = returnItems.reduce((sum, i) => sum + i.refundAmount, 0);

    // Give the physical stock back
    await restockItems(
      returnItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      branchDb,
    );

    const returnNumber = `RET-${branch.code}-${Date.now()}`;
    const returnDoc = await Return.create({
      returnNumber,
      originalSaleId: sale._id,
      originalSaleNumber: sale.saleNumber,
      cashierId: sale.cashierId,
      cashierName: sale.cashierName,
      processedBy: req.user.id,
      processedByName: req.user.name,
      items: returnItems,
      refundAmount,
      reason: reason || "",
      type: resolvedType,
    });

    const ReturnSummary = getCentralReturnSummaryModel();
    await ReturnSummary.create({
      branchId: branch._id,
      branchName: branch.name,
      returnId: returnDoc._id,
      returnNumber: returnDoc.returnNumber,
      originalSaleId: sale._id,
      originalSaleNumber: sale.saleNumber,
      itemCount: returnItems.length,
      refundAmount,
      type: resolvedType,
      processedBy: req.user.id,
      processedByName: req.user.name,
    });

    return res.status(201).json({
      success: true,
      message: resolvedType === "exchange" ? "Return recorded — ring up the replacement items next" : "Return recorded",
      data: returnDoc,
    });
  } catch (error: any) {
    console.error("❌ Create Return Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const getReturnsOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { branchId, startDate, endDate } = req.query;

    const filter: Record<string, unknown> = {};
    if (branchId) {
      const branch = await resolveBranch(branchId as string);
      if (branch) filter.branchId = branch._id;
    }
    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {};
      if (startDate) createdAt.$gte = new Date(startDate as string);
      if (endDate) createdAt.$lte = new Date(endDate as string);
      filter.createdAt = createdAt;
    }

    const ReturnSummary = getCentralReturnSummaryModel();
    const summaries = await ReturnSummary.find(filter).sort({ createdAt: -1 });

    const totalRefunded = summaries.reduce((sum, r) => sum + r.refundAmount, 0);

    const byBranch: Record<string, { branchName: string; total: number; count: number }> = {};
    for (const s of summaries) {
      const key = s.branchId.toString();
      if (!byBranch[key]) {
        byBranch[key] = { branchName: s.branchName, total: 0, count: 0 };
      }
      byBranch[key].total += s.refundAmount;
      byBranch[key].count += 1;
    }

    return res.status(200).json({
      success: true,
      data: summaries,
      totalRefunded,
      byBranch: Object.values(byBranch),
    });
  } catch (error: any) {
    console.error("❌ Get Returns Overview Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const getReturnDetail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id || typeof id !== "string" || !isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid Return ID" });
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
    const Return = getReturnModel(branchDb);
    const returnDoc = await Return.findById(id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, message: "Return not found" });
    }

    return res.status(200).json({ success: true, data: returnDoc, branchName: branch.name });
  } catch (error: any) {
    console.error("❌ Get Return Detail Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBranchReturns = async (req: AuthenticatedRequest, res: Response) => {
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
    const Return = getReturnModel(branchDb);

    const returns = await Return.find().sort({ createdAt: -1 });
    const totalRefunded = returns.reduce((sum, r) => sum + r.refundAmount, 0);

    return res.status(200).json({
      success: true,
      data: returns,
      totalRefunded,
      branchName: branch.name,
    });
  } catch (error: any) {
    console.error("❌ Get Branch Returns Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};