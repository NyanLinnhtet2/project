import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { resolveReportBranches, collectSalesAndReturns } from "../utils/reportData";

// ============================================================
// GET /api/reports/summary — Manager: own branch. Admin: pass ?branchId=
// for one branch, or omit it for a company-wide report.
// Query: ?branchId=&startDate=&endDate=
// ============================================================
export const getReportSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { branchId, startDate, endDate } = req.query;

    const branches = await resolveReportBranches(
      req.user.role,
      req.user.branch,
      branchId as string | undefined,
    );
    if (branches.length === 0) {
      return res.status(404).json({ success: false, message: "No branch found" });
    }

    const range: { startDate?: string; endDate?: string } = {};
    if (typeof startDate === "string") range.startDate = startDate;
    if (typeof endDate === "string") range.endDate = endDate;

    const { sales, returns } = await collectSalesAndReturns(branches, range);

    const completedSales = sales.filter((s) => s.status === "completed");

    // ---- Cashier performance ----
    const cashierMap = new Map<
      string,
      { cashierName: string; branchName: string; totalRevenue: number; transactionCount: number }
    >();
    for (const s of completedSales) {
      const existing = cashierMap.get(s.cashierId);
      if (existing) {
        existing.totalRevenue += s.totalAmount;
        existing.transactionCount += 1;
      } else {
        cashierMap.set(s.cashierId, {
          cashierName: s.cashierName,
          branchName: s.branchName,
          totalRevenue: s.totalAmount,
          transactionCount: 1,
        });
      }
    }
    const cashierPerformance = Array.from(cashierMap.values())
      .map((c) => ({
        ...c,
        avgBasket: c.transactionCount > 0 ? Math.round(c.totalRevenue / c.transactionCount) : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // ---- Category breakdown ----
    const categoryMap = new Map<string, { category: string; revenue: number; quantity: number }>();
    for (const s of completedSales) {
      for (const item of s.items) {
        const cat = item.category || "Uncategorized";
        const existing = categoryMap.get(cat);
        const lineRevenue = item.price * item.quantity;
        if (existing) {
          existing.revenue += lineRevenue;
          existing.quantity += item.quantity;
        } else {
          categoryMap.set(cat, { category: cat, revenue: lineRevenue, quantity: item.quantity });
        }
      }
    }
    const categoryBreakdown = Array.from(categoryMap.values()).sort(
      (a, b) => b.revenue - a.revenue,
    );

    // ---- Discount & return rate ----
    const grossSubtotal = completedSales.reduce((sum, s) => sum + s.subtotal, 0);
    const totalDiscount = completedSales.reduce((sum, s) => sum + s.discountAmount, 0);
    const salesWithDiscountCount = completedSales.filter((s) => s.discountAmount > 0).length;
    const grossRevenue = completedSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalRefund = returns.reduce((sum, r) => sum + r.refundAmount, 0);

    const discountReturnRate = {
      totalDiscount,
      discountRatePercent: grossSubtotal > 0 ? Number(((totalDiscount / grossSubtotal) * 100).toFixed(2)) : 0,
      salesWithDiscountCount,
      totalTransactions: completedSales.length,
      totalRefund,
      returnRatePercent: grossRevenue > 0 ? Number(((totalRefund / grossRevenue) * 100).toFixed(2)) : 0,
      returnCount: returns.length,
    };

    // ---- KPIs ----
    const kpis = {
      netRevenue: grossRevenue - totalRefund,
      grossRevenue,
      totalTransactions: completedSales.length,
      avgBasketSize: completedSales.length > 0 ? Math.round(grossRevenue / completedSales.length) : 0,
      totalRefunded: totalRefund,
    };

    // ---- Daily revenue trend ----
    const dailyMap = new Map<string, number>();
    for (const s of completedSales) {
      const day = new Date(s.createdAt).toISOString().slice(0, 10); // YYYY-MM-DD
      dailyMap.set(day, (dailyMap.get(day) || 0) + s.totalAmount);
    }
    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ---- Payment method breakdown ----
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

    // ---- Top products ----
    const productMap = new Map<
      string,
      { productId: string; name: string; revenue: number; quantity: number }
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
            productId: key,
            name: item.name,
            revenue: lineRevenue,
            quantity: item.quantity,
          });
        }
      }
    }
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // ---- Branch comparison (only meaningful with more than one branch) ----
    const branchMap = new Map<string, { branchName: string; revenue: number; transactionCount: number }>();
    for (const s of completedSales) {
      const existing = branchMap.get(s.branchName);
      if (existing) {
        existing.revenue += s.totalAmount;
        existing.transactionCount += 1;
      } else {
        branchMap.set(s.branchName, {
          branchName: s.branchName,
          revenue: s.totalAmount,
          transactionCount: 1,
        });
      }
    }
    const branchComparison = Array.from(branchMap.values()).sort(
      (a, b) => b.revenue - a.revenue,
    );

    return res.status(200).json({
      success: true,
      data: {
        kpis,
        dailyTrend,
        paymentBreakdown,
        topProducts,
        cashierPerformance,
        categoryBreakdown,
        discountReturnRate,
        branchComparison,
      },
      branches: branches.map((b) => ({ _id: b._id, name: b.name })),
    });
  } catch (error: any) {
    console.error("❌ Get Report Summary Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};