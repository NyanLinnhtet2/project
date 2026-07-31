import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { getCentralCustomerModel } from "../models/CentralDB/customer";
import { getCentralMembershipTierModel } from "../models/CentralDB/membershiptier";
import { getCentralCouponModel } from "../models/CentralDB/coupon";
import { getCentralSaleSummaryModel } from "../models/CentralDB/saleSummary";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getBranchConnection } from "../db/db";
import { getSaleModel } from "../models/BranchDB/sale";

const isValidObjectId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

// ============================================================
// POST /api/customers — Cashier/Manager/Admin registers a new customer
// ============================================================
export const createCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { name, phone, email, dateOfBirth } = req.body as {
      name: string;
      phone: string;
      email?: string;
      dateOfBirth?: string;
    };

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: "name and phone are required" });
    }

    const Customer = getCentralCustomerModel();
    const existing = await Customer.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A customer with this phone number already exists",
      });
    }

    const MembershipTier = getCentralMembershipTierModel();
    const lowestTier = await MembershipTier.findOne().sort({ order: 1 });

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      ...(email?.trim() ? { email: email.trim() } : {}),
      ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
      membershipLevel: lowestTier?.name || "Bronze",
      registeredBranch: req.user.branch,
    });

    return res.status(201).json({ success: true, data: customer });
  } catch (error: any) {
    console.error("❌ Create Customer Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET /api/customers/search?q= — Cashier/Manager/Admin looks up a
// customer by phone or name at checkout
// ============================================================
export const searchCustomers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    if (!q.trim()) {
      return res.status(200).json({ success: true, data: [] });
    }

    const Customer = getCentralCustomerModel();
    const customers = await Customer.find({
      $or: [
        { phone: { $regex: q.trim(), $options: "i" } },
        { name: { $regex: q.trim(), $options: "i" } },
      ],
    })
      .limit(10)
      .sort({ name: 1 });

    return res.status(200).json({ success: true, data: customers });
  } catch (error: any) {
    console.error("❌ Search Customers Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET /api/customers — Manager/Admin: paginated list
// ============================================================
export const listCustomers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 20;

    const Customer = getCentralCustomerModel();
    const [customers, total] = await Promise.all([
      Customer.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Customer.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: customers,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    console.error("❌ List Customers Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET /api/customers/:id — full profile: purchase history, favorite
// products, coupons, and membership progress
// ============================================================
export const getCustomerProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string" || !isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    const Customer = getCentralCustomerModel();
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Purchase history — fast, CentralDB-only (SaleSummary carries customerId)
    const SaleSummary = getCentralSaleSummaryModel();
    const purchaseHistory = await SaleSummary.find({ customerId: customer._id }).sort({
      createdAt: -1,
    });

    // Favorite products — needs item-level detail, so only look at the
    // branches this customer has actually bought from (from the summary
    // above), not every branch in the company.
    const branchIds = [...new Set(purchaseHistory.map((p) => p.branchId.toString()))];
    const Branch = getCentralBranchModel();
    const branches = await Branch.find({ _id: { $in: branchIds } });

    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const branch of branches) {
      const branchDb = getBranchConnection(branch.dbName);
      const Sale = getSaleModel(branchDb);
      const sales = await Sale.find({ customerId: customer._id, status: "completed" });
      for (const sale of sales) {
        for (const item of sale.items) {
          const key = item.productId.toString();
          const existing = productMap.get(key);
          const lineRevenue = item.price * item.quantity;
          if (existing) {
            existing.quantity += item.quantity;
            existing.revenue += lineRevenue;
          } else {
            productMap.set(key, { name: item.name, quantity: item.quantity, revenue: lineRevenue });
          }
        }
      }
    }
    const favoriteProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Coupons
    const Coupon = getCentralCouponModel();
    const coupons = await Coupon.find({ customerId: customer._id }).sort({ createdAt: -1 });

    // Membership progress — how many more purchases to the next tier
    const MembershipTier = getCentralMembershipTierModel();
    const tiers = await MembershipTier.find().sort({ order: 1 });
    const nextTier = tiers.find((t) => t.minPurchaseCount > customer.purchaseCount) || null;

    return res.status(200).json({
      success: true,
      data: {
        customer,
        purchaseHistory,
        favoriteProducts,
        coupons,
        nextTier: nextTier
          ? {
              name: nextTier.name,
              purchasesNeeded: nextTier.minPurchaseCount - customer.purchaseCount,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("❌ Get Customer Profile Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// PATCH /api/customers/:id — Manager/Admin edits customer info
// ============================================================
export const updateCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string" || !isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    const allowedFields = ["name", "phone", "email", "dateOfBirth"] as const;
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in req.body) updates[field] = req.body[field];
    }

    const Customer = getCentralCustomerModel();
    const customer = await Customer.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    return res.status(200).json({ success: true, data: customer });
  } catch (error: any) {
    console.error("❌ Update Customer Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};