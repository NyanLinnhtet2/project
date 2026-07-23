import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { getCentralDiscountEventModel } from "../models/CentralDB/discountEvent";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import {
  getEffectiveDiscountCap,
  STATIC_DISCOUNT_CAP_PERCENT,
} from "../utils/discountCap";

const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

// ============================================================
// POST /api/discount-events — Admin creates an event window
// ============================================================
export const createDiscountEvent = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      name,
      scope,
      branchIds,
      cashierCap,
      managerCap,
      startDate,
      endDate,
    } = req.body as {
      name: string;
      scope: "all" | "branch";
      branchIds?: string[];
      cashierCap: number;
      managerCap: number;
      startDate: string;
      endDate: string;
    };

    if (!name || !scope || cashierCap == null || managerCap == null || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "name, scope, cashierCap, managerCap, startDate and endDate are required",
      });
    }

    if (scope !== "all" && scope !== "branch") {
      return res.status(400).json({
        success: false,
        message: "scope must be 'all' or 'branch'",
      });
    }

    if (scope === "branch") {
      if (!Array.isArray(branchIds) || branchIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "branchIds is required when scope is 'branch'",
        });
      }
      for (const id of branchIds) {
        if (!isValidObjectId(id)) {
          return res.status(400).json({
            success: false,
            message: `Invalid branch ID: ${id}`,
          });
        }
      }
    }

    if (cashierCap < 0 || cashierCap > 100 || managerCap < 0 || managerCap > 100) {
      return res.status(400).json({
        success: false,
        message: "cashierCap and managerCap must be between 0 and 100",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({
        success: false,
        message: "endDate must be after startDate",
      });
    }

    const DiscountEvent = getCentralDiscountEventModel();
    const event = await DiscountEvent.create({
      name,
      scope,
      branchIds: scope === "branch" ? branchIds ?? [] : [],
      cashierCap,
      managerCap,
      startDate: start,
      endDate: end,
      isActive: true,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Discount event created",
      data: event,
    });
  } catch (error: any) {
    console.error("❌ Create Discount Event Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET /api/discount-events — Admin lists all events (with branch names)
// ============================================================
export const getDiscountEvents = async (
  _req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const DiscountEvent = getCentralDiscountEventModel();
    const events = await DiscountEvent.find().sort({ createdAt: -1 });

    // populate branch names for scope==="branch" events (cross-connection,
    // so a manual lookup instead of .populate())
    const Branch = getCentralBranchModel();
    const branchIdStrings = [
      ...new Set(
        events.flatMap((e) => e.branchIds.map((id) => id.toString())),
      ),
    ];
    const branchIds = branchIdStrings.map((id) => new mongoose.Types.ObjectId(id));
    const branches = await Branch.find({ _id: { $in: branchIds } }).select(
      "name",
    );
    const branchNameById = new Map(
      branches.map((b) => [b._id.toString(), b.name]),
    );

    const now = new Date();
    const data = events.map((e) => ({
      ...e.toObject(),
      branchNames: e.branchIds.map(
        (id: mongoose.Types.ObjectId) =>
          branchNameById.get(id.toString()) || "Unknown",
      ),
      isCurrentlyLive: e.isActive && e.startDate <= now && e.endDate >= now,
    }));

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("❌ Get Discount Events Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// PATCH /api/discount-events/:id — Admin edits or deactivates an event
// ============================================================
export const updateDiscountEvent = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string" || !isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const allowedFields = [
      "name",
      "scope",
      "branchIds",
      "cashierCap",
      "managerCap",
      "startDate",
      "endDate",
      "isActive",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in req.body) updates[field] = req.body[field];
    }

    const DiscountEvent = getCentralDiscountEventModel();
    const event = await DiscountEvent.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Discount event updated",
      data: event,
    });
  } catch (error: any) {
    console.error("❌ Update Discount Event Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// DELETE /api/discount-events/:id — Admin removes an event
// ============================================================
export const deleteDiscountEvent = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string" || !isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const DiscountEvent = getCentralDiscountEventModel();
    const deleted = await DiscountEvent.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    return res.status(200).json({ success: true, message: "Discount event deleted" });
  } catch (error: any) {
    console.error("❌ Delete Discount Event Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET /api/discount-events/effective-cap — Cashier/Manager/Admin:
// "what's my discount limit right now" (static floor, or a live event's
// cap if one applies to my branch). NewSale.tsx calls this instead of
// hardcoding the cap on the client.
// ============================================================
export const getMyEffectiveDiscountCap = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role !== "cashier" && req.user.role !== "manager") {
      return res.status(200).json({
        success: true,
        data: { capPercent: 100, source: "static" },
      });
    }

    const Branch = getCentralBranchModel();
    const branch = isValidObjectId(req.user.branch)
      ? await Branch.findById(req.user.branch)
      : await Branch.findOne({ name: req.user.branch });

    if (!branch) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }

    const result = await getEffectiveDiscountCap(req.user.role, branch._id);

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error("❌ Get Effective Discount Cap Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// exported so callers that only need the plain static table (rare) can
// still reach it without importing straight from utils/discountCap
export { STATIC_DISCOUNT_CAP_PERCENT };