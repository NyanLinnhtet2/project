import { Response } from "express";
import mongoose, { HydratedDocument } from "mongoose";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getCentralSaleSummaryModel } from "../models/CentralDB/saleSummary";
import {
  getCentralDiscountApprovalRequestModel,
  IDiscountApprovalRequest,
} from "../models/CentralDB/discountApproval";
import { getBranchConnection } from "../db/db";
import { getSaleModel } from "../models/BranchDB/sale";
import { getEffectiveDiscountCap } from "../utils/discountCap";
import {
  priceAndValidateItems,
  deductStockForItems,
  restockItems,
  computeDiscountAndTax,
} from "../utils/salePricing";
import { getCentralCustomerModel } from "../models/CentralDB/customer";
import { getCentralCouponModel } from "../models/CentralDB/coupon";
import { validateCoupon, recordCustomerPurchase } from "../utils/membership";

const REQUEST_TTL_MS = 5 * 60 * 1000; // 5 minutes

const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

const resolveBranch = async (branchIdOrName: string) => {
  const Branch = getCentralBranchModel();
  if (isValidObjectId(branchIdOrName)) {
    return await Branch.findById(branchIdOrName);
  }
  return await Branch.findOne({ name: branchIdOrName });
};

// If a pending request's 15-minute window has passed, flip it to "expired"
// and give the reserved stock back. Called before every read/action so we
// never need a background cron job. Returns the (possibly updated) doc.
const expireIfStale = async (
  request: HydratedDocument<IDiscountApprovalRequest>,
): Promise<HydratedDocument<IDiscountApprovalRequest>> => {
  if (request.status !== "pending") return request;
  if (request.expiresAt > new Date()) return request;

  const branch = await resolveBranch(request.branchId.toString());
  if (branch) {
    const branchDb = getBranchConnection(branch.dbName);
    await restockItems(request.items, branchDb);
  }
  request.status = "expired";
  await request.save();
  return request;
};

// ============================================================
// POST /api/discount-approval-requests — Cashier/Manager asks for
// permission to apply a discount above their own cap. Stock is reserved
// (deducted) immediately so it can't be sold out from under the request
// while it waits; approve finalizes the reservation into a Sale, anything
// else (reject/expire/cancel) gives the stock back.
// ============================================================
export const createDiscountApprovalRequest = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (req.user.role !== "cashier" && req.user.role !== "manager") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { items, paymentMethod, discountType, discountValue, taxRate, customerId, couponCode } =
      req.body as {
        items: { productId: string; quantity: number }[];
        paymentMethod?: string;
        discountType?: string;
        discountValue?: number;
        taxRate?: number;
        customerId?: string;
        couponCode?: string;
      };

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
    if (resolvedTaxRate < 0 || resolvedTaxRate > 100) {
      return res.status(400).json({
        success: false,
        message: "Tax rate must be between 0 and 100",
      });
    }

    const branch = await resolveBranch(req.user.branch);
    if (!branch) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    const branchDb = getBranchConnection(branch.dbName);

    const priced = await priceAndValidateItems(items, branchDb);
    if (!priced.ok) {
      return res
        .status(priced.status)
        .json({ success: false, message: priced.message });
    }

    const { discountAmount, taxAmount, totalAmount } = computeDiscountAndTax(
      priced.subtotal,
      resolvedDiscountType,
      resolvedDiscountValue,
      resolvedTaxRate,
    );

    // Optional customer + coupon — same rules as the direct-checkout path
    // in controllers/sale.ts: coupon requires a customer, is validated (but
    // NOT redeemed yet — that happens on approve), and its discount is on
    // top of the manual discount rather than counted toward the cap below.
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
    if (couponCode && !customer) {
      return res.status(400).json({
        success: false,
        message: "A customer must be selected to use a coupon",
      });
    }
    let couponDiscountAmount = 0;
    if (couponCode && customer) {
      const couponResult = await validateCoupon(couponCode, customer.id);
      if (!couponResult.ok) {
        return res.status(400).json({ success: false, message: couponResult.message });
      }
      const rawCouponDiscount =
        couponResult.coupon.discountType === "percent"
          ? Math.round((priced.subtotal * couponResult.coupon.discountValue) / 100)
          : Math.round(couponResult.coupon.discountValue);
      couponDiscountAmount = Math.min(Math.max(rawCouponDiscount, 0), totalAmount);
    }
    const finalTotalAmount = totalAmount - couponDiscountAmount;

    // Route to the right approver: a manager's own request always escalates
    // straight to admin (there's no one above manager but admin). A
    // cashier's request goes to their branch manager UNLESS the discount is
    // beyond what even the manager is allowed — then it skips straight to
    // admin too.
    let requiredApproverLevel: "manager" | "admin";
    if (req.user.role === "manager") {
      requiredApproverLevel = "admin";
    } else {
      const { capPercent: managerCapPercent } = await getEffectiveDiscountCap(
        "manager",
        branch._id,
      );
      const effectivePercent =
        priced.subtotal > 0 ? (discountAmount / priced.subtotal) * 100 : 0;
      requiredApproverLevel =
        effectivePercent <= managerCapPercent + 0.01 ? "manager" : "admin";
    }

    // Reserve the stock now — released on reject/expire/cancel, consumed
    // for real once a Sale is created on approve.
    await deductStockForItems(priced.items, branchDb);

    const DiscountApprovalRequest = getCentralDiscountApprovalRequestModel();
    const request = await DiscountApprovalRequest.create({
      branchId: branch._id,
      branchName: branch.name,
      cashierId: req.user.id,
      cashierName: req.user.name,
      cashierRole: req.user.role,
      items: priced.items,
      subtotal: priced.subtotal,
      discountType: resolvedDiscountType,
      discountValue: resolvedDiscountValue,
      discountAmount,
      taxRate: resolvedTaxRate,
      taxAmount,
      totalAmount: finalTotalAmount,
      paymentMethod: paymentMethod || "cash",
      requiredApproverLevel,
      status: "pending",
      expiresAt: new Date(Date.now() + REQUEST_TTL_MS),
      ...(customer ? { customerId: customer._id, customerName: customer.name } : {}),
      ...(couponCode && couponDiscountAmount > 0
        ? { couponCode: couponCode.trim().toUpperCase(), couponDiscountAmount }
        : {}),
    });

    return res.status(201).json({ success: true, data: request });
  } catch (error: any) {
    console.error("❌ Create Discount Approval Request Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET /api/discount-approval-requests/mine — Cashier/Manager polls this
// for the status of their most recent request.
// ============================================================
export const getMyLatestRequest = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const DiscountApprovalRequest = getCentralDiscountApprovalRequestModel();
    let request = await DiscountApprovalRequest.findOne({
      cashierId: req.user.id,
    }).sort({ createdAt: -1 });

    if (!request) {
      return res.status(200).json({ success: true, data: null });
    }

    request = await expireIfStale(request);

    return res.status(200).json({ success: true, data: request });
  } catch (error: any) {
    console.error("❌ Get My Latest Request Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET /api/discount-approval-requests/pending — Manager: own-branch
// requests waiting on them. Admin: every request waiting on them,
// across all branches.
// ============================================================
export const getPendingApprovals = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const DiscountApprovalRequest = getCentralDiscountApprovalRequestModel();
    const filter: Record<string, unknown> = {
      status: "pending",
      requiredApproverLevel: req.user.role,
    };

    if (req.user.role === "manager") {
      const branch = await resolveBranch(req.user.branch);
      if (!branch) {
        return res
          .status(404)
          .json({ success: false, message: "Branch not found" });
      }
      filter.branchId = branch._id;
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const candidates = await DiscountApprovalRequest.find(filter).sort({
      createdAt: 1,
    });

    // lazy-expire any that have quietly timed out, and drop them from the list
    const stillPending = [];
    for (const candidate of candidates) {
      const updated = await expireIfStale(candidate);
      if (updated.status === "pending") stillPending.push(updated);
    }

    return res.status(200).json({ success: true, data: stillPending });
  } catch (error: any) {
    console.error("❌ Get Pending Approvals Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// POST /api/discount-approval-requests/:id/approve
// ============================================================
export const approveRequest = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id || typeof id !== "string" || !isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const DiscountApprovalRequest = getCentralDiscountApprovalRequestModel();
    let request = await DiscountApprovalRequest.findById(id);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    request = await expireIfStale(request);
    if (request.status === "expired") {
      return res
        .status(410)
        .json({ success: false, message: "Request expired" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    // Authorization: a manager may only approve their own branch's
    // manager-level requests; admin may approve anything.
    if (req.user.role === "admin") {
      // always allowed
    } else if (
      req.user.role === "manager" &&
      request.requiredApproverLevel === "manager" &&
      req.user.branch === request.branchName
    ) {
      // allowed
    } else {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const branch = await resolveBranch(request.branchId.toString());
    if (!branch) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }
    const branchDb = getBranchConnection(branch.dbName);
    const Sale = getSaleModel(branchDb);

    // Stock was already reserved when the request was created — just
    // finalize it into a real Sale, no second stock check/deduction.
    const ALLOWED_PAYMENT_METHODS = [
      "cash",
      "kbz_pay",
      "wave_pay",
      "card",
      "other",
    ] as const;
    const paymentMethod = ALLOWED_PAYMENT_METHODS.includes(
      request.paymentMethod as (typeof ALLOWED_PAYMENT_METHODS)[number],
    )
      ? (request.paymentMethod as (typeof ALLOWED_PAYMENT_METHODS)[number])
      : "cash";

    // If a coupon was attached, re-check it right before redeeming — it may
    // have expired or been used elsewhere during the time this request sat
    // pending. On failure the request stays "pending" so it can be retried
    // (e.g. after the cashier picks a different coupon) rather than losing
    // the reserved stock.
    if (request.couponCode && request.customerId) {
      const couponResult = await validateCoupon(
        request.couponCode,
        request.customerId.toString(),
      );
      if (!couponResult.ok) {
        return res.status(400).json({
          success: false,
          message: `Coupon can no longer be redeemed: ${couponResult.message}`,
        });
      }
    }

    const saleNumber = `SALE-${branch.code}-${Date.now()}`;
    const sale = await Sale.create({
      saleNumber,
      cashierId: request.cashierId,
      cashierName: request.cashierName,
      items: request.items,
      subtotal: request.subtotal,
      discountType: request.discountType,
      discountValue: request.discountValue,
      discountAmount: request.discountAmount,
      taxRate: request.taxRate,
      taxAmount: request.taxAmount,
      totalAmount: request.totalAmount,
      paymentMethod,
      status: "completed",
      approvedBy: req.user.id,
      approvedByName: req.user.name,
      ...(request.customerId ? { customerId: request.customerId } : {}),
      ...(request.couponCode
        ? { couponCode: request.couponCode, couponDiscountAmount: request.couponDiscountAmount }
        : {}),
    });

    const SaleSummary = getCentralSaleSummaryModel();
    await SaleSummary.create({
      branchId: branch._id,
      branchName: branch.name,
      saleId: sale._id,
      saleNumber: sale.saleNumber,
      cashierId: request.cashierId,
      cashierName: request.cashierName,
      itemCount: request.items.length,
      subtotal: request.subtotal,
      discountAmount: request.discountAmount,
      taxAmount: request.taxAmount,
      totalAmount: request.totalAmount,
      paymentMethod: request.paymentMethod,
      status: "completed",
      ...(request.customerId ? { customerId: request.customerId } : {}),
    });

    // Best-effort follow-ups, same reasoning as controllers/sale.ts — the
    // sale already committed, so these shouldn't be able to undo it.
    if (request.couponCode && request.customerId) {
      try {
        const Coupon = getCentralCouponModel();
        await Coupon.updateOne(
          { code: request.couponCode },
          { status: "used", usedInSaleId: sale._id, usedAt: new Date() },
        );
      } catch (couponErr) {
        console.error("⚠️ Failed to mark coupon used:", couponErr);
      }
    }
    if (request.customerId) {
      try {
        await recordCustomerPurchase(request.customerId.toString(), request.totalAmount);
      } catch (custErr) {
        console.error("⚠️ Failed to update customer purchase stats:", custErr);
      }
    }

    request.status = "approved";
    request.reviewedBy = req.user.id;
    request.reviewedByName = req.user.name;
    request.resultingSaleId = sale._id as mongoose.Types.ObjectId;
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Approved — sale recorded",
      data: { request, sale },
    });
  } catch (error: any) {
    console.error("❌ Approve Request Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// POST /api/discount-approval-requests/:id/reject
// ============================================================
export const rejectRequest = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id || typeof id !== "string" || !isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const { reason } = req.body as { reason?: string };

    const DiscountApprovalRequest = getCentralDiscountApprovalRequestModel();
    let request = await DiscountApprovalRequest.findById(id);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    request = await expireIfStale(request);
    if (request.status === "expired") {
      return res
        .status(410)
        .json({ success: false, message: "Request expired" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    if (req.user.role === "admin") {
      // always allowed
    } else if (
      req.user.role === "manager" &&
      request.requiredApproverLevel === "manager" &&
      req.user.branch === request.branchName
    ) {
      // allowed
    } else {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const branch = await resolveBranch(request.branchId.toString());
    if (branch) {
      const branchDb = getBranchConnection(branch.dbName);
      await restockItems(request.items, branchDb);
    }

    request.status = "rejected";
    request.reviewedBy = req.user.id;
    request.reviewedByName = req.user.name;
    request.reviewNote = reason || "";
    await request.save();

    return res
      .status(200)
      .json({ success: true, message: "Request rejected", data: request });
  } catch (error: any) {
    console.error("❌ Reject Request Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// POST /api/discount-approval-requests/:id/cancel — Cashier/Manager
// withdraws their own still-pending request.
// ============================================================
export const cancelRequest = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id || typeof id !== "string" || !isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const DiscountApprovalRequest = getCentralDiscountApprovalRequestModel();
    let request = await DiscountApprovalRequest.findById(id);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }
    if (request.cashierId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    request = await expireIfStale(request);
    if (request.status === "expired") {
      return res
        .status(410)
        .json({ success: false, message: "Request expired" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    const branch = await resolveBranch(request.branchId.toString());
    if (branch) {
      const branchDb = getBranchConnection(branch.dbName);
      await restockItems(request.items, branchDb);
    }

    request.status = "cancelled";
    await request.save();

    return res
      .status(200)
      .json({ success: true, message: "Request cancelled", data: request });
  } catch (error: any) {
    console.error("❌ Cancel Request Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};