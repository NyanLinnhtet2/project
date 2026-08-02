import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import {
  resolveReportBranches,
  collectSalesAndReturns,
} from "../utils/reportData";
import { getBranchConnection } from "../db/db";
import { getBranchStockModel } from "../models/BranchDB/stock";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getCentralProductModel } from "../models/CentralDB/products";
import { getCentralCustomerModel } from "../models/CentralDB/customer";
import { getCentralDiscountApprovalRequestModel } from "../models/CentralDB/discountApproval";
import { getCentralCouponModel } from "../models/CentralDB/coupon";
import { isBirthdayToday } from "../utils/birthdaycoupon";

const todayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

export const getDashboardOverview = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { branchId } = req.query;
    const branches = await resolveReportBranches(
      req.user.role,
      req.user.branch,
      branchId as string | undefined,
    );
    if (branches.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No branch found" });
    }

    // Rolling 7-day window (today inclusive) — no upper bound, so it
    // always includes anything up to right now.
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const { sales } = await collectSalesAndReturns(branches, {
      startDate: weekAgo.toISOString(),
    });
    const completedSales = sales.filter((s) => s.status === "completed");

    const now = new Date();
    const todayStr = todayKey(now);
    const todaysSales = completedSales.filter(
      (s) => todayKey(s.createdAt) === todayStr,
    );

    const today = {
      revenue: todaysSales.reduce((sum, s) => sum + s.totalAmount, 0),
      transactions: todaysSales.length,
      avgBasket:
        todaysSales.length > 0
          ? Math.round(
              todaysSales.reduce((sum, s) => sum + s.totalAmount, 0) /
                todaysSales.length,
            )
          : 0,
    };

    // ---- 7-day trend, zero-filled so every day shows even with no sales ----
    const dayBuckets: {
      date: string;
      revenue: number;
      transactions: number;
    }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayBuckets.push({ date: todayKey(d), revenue: 0, transactions: 0 });
    }
    const bucketMap = new Map(dayBuckets.map((b) => [b.date, b]));
    for (const s of completedSales) {
      const bucket = bucketMap.get(todayKey(s.createdAt));
      if (bucket) {
        bucket.revenue += s.totalAmount;
        bucket.transactions += 1;
      }
    }
    const weeklyTrend = dayBuckets;

    // ---- Payment method breakdown (this week) — pie chart ----
    const paymentMap = new Map<string, { amount: number; count: number }>();
    for (const s of completedSales) {
      const existing = paymentMap.get(s.paymentMethod);
      if (existing) {
        existing.amount += s.totalAmount;
        existing.count += 1;
      } else {
        paymentMap.set(s.paymentMethod, { amount: s.totalAmount, count: 1 });
      }
    }
    const paymentBreakdown = Array.from(paymentMap.entries())
      .map(([method, v]) => ({ method, amount: v.amount, count: v.count }))
      .sort((a, b) => b.amount - a.amount);

    // ---- Category breakdown (this week) — pie chart ----
    const categoryMap = new Map<
      string,
      { revenue: number; quantity: number }
    >();
    for (const s of completedSales) {
      for (const item of s.items) {
        const cat = item.category || "Uncategorized";
        const lineRevenue = item.price * item.quantity;
        const existing = categoryMap.get(cat);
        if (existing) {
          existing.revenue += lineRevenue;
          existing.quantity += item.quantity;
        } else {
          categoryMap.set(cat, {
            revenue: lineRevenue,
            quantity: item.quantity,
          });
        }
      }
    }
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, v]) => ({
        category,
        revenue: v.revenue,
        quantity: v.quantity,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // ---- Top 5 products (this week) ----
    const productMap = new Map<
      string,
      { name: string; revenue: number; quantity: number }
    >();
    for (const s of completedSales) {
      for (const item of s.items) {
        const key = item.productId.toString();
        const lineRevenue = item.price * item.quantity;
        const existing = productMap.get(key);
        if (existing) {
          existing.revenue += lineRevenue;
          existing.quantity += item.quantity;
        } else {
          productMap.set(key, {
            name: item.name,
            revenue: lineRevenue,
            quantity: item.quantity,
          });
        }
      }
    }
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ---- Branch comparison (this week) — only meaningful with >1 branch ----
    const branchMap = new Map<
      string,
      { revenue: number; transactionCount: number }
    >();
    for (const s of completedSales) {
      const existing = branchMap.get(s.branchName);
      if (existing) {
        existing.revenue += s.totalAmount;
        existing.transactionCount += 1;
      } else {
        branchMap.set(s.branchName, {
          revenue: s.totalAmount,
          transactionCount: 1,
        });
      }
    }
    const branchComparison = Array.from(branchMap.entries())
      .map(([branchName, v]) => ({
        branchName,
        revenue: v.revenue,
        transactionCount: v.transactionCount,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // ---- Recent 5 sales ----
    const recentSales = [...sales]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5)
      .map((s) => ({
        saleNumber: s.saleNumber,
        cashierName: s.cashierName,
        branchName: s.branchName,
        totalAmount: s.totalAmount,
        status: s.status,
        createdAt: s.createdAt,
      }));

    // ---- Coupon breakdown (this week) — pie chart ----
    const salesWithCoupon = completedSales.filter((s) => s.couponCode);
    const couponCodes = [
      ...new Set(salesWithCoupon.map((s) => s.couponCode as string)),
    ];
    const Coupon = getCentralCouponModel();
    const couponDocs =
      couponCodes.length > 0
        ? await Coupon.find({ code: { $in: couponCodes } }).select("code type")
        : [];
    const codeTypeMap = new Map(couponDocs.map((c) => [c.code, c.type]));
    const couponTypeMap = new Map<string, number>();
    for (const s of salesWithCoupon) {
      const type = codeTypeMap.get(s.couponCode as string) || "unknown";
      couponTypeMap.set(type, (couponTypeMap.get(type) || 0) + 1);
    }
    const couponBreakdown = Array.from(couponTypeMap.entries()).map(
      ([type, count]) => ({
        type,
        count,
      }),
    );

    // ---- Scope-wide counts ----
    const Branch = getCentralBranchModel();
    const Product = getCentralProductModel();
    const Customer = getCentralCustomerModel();
    const DiscountApprovalRequest = getCentralDiscountApprovalRequestModel();

    const [
      totalBranches,
      totalProducts,
      totalCustomers,
      pendingApprovals,
      allCustomersForBirthday,
    ] = await Promise.all([
      Branch.countDocuments(),
      Product.countDocuments(),
      Customer.countDocuments(),
      DiscountApprovalRequest.countDocuments({
        status: "pending",
        branchId: { $in: branches.map((b) => b._id) },
      }),
      Customer.find({ dateOfBirth: { $exists: true } }).select("dateOfBirth"),
    ]);
    const birthdaysToday = allCustomersForBirthday.filter((c) =>
      isBirthdayToday(c.dateOfBirth),
    ).length;

    // Low/out-of-stock count across the resolved branches' own Stock collections
    let lowStockCount = 0;
    for (const branch of branches) {
      const branchDb = getBranchConnection(branch.dbName);
      const Stock = getBranchStockModel(branchDb);
      lowStockCount += await Stock.countDocuments({
        status: { $in: ["Low Stock", "Out of Stock"] },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        today,
        weeklyTrend,
        paymentBreakdown,
        categoryBreakdown,
        topProducts,
        branchComparison,
        recentSales,
        couponBreakdown,
        counts: {
          totalBranches,
          totalProducts,
          totalCustomers,
          pendingApprovals,
          birthdaysToday,
          lowStockCount,
        },
      },
      branches: branches.map((b) => ({ _id: b._id, name: b.name })),
    });
  } catch (error: any) {
    console.error("❌ Get Dashboard Overview Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
