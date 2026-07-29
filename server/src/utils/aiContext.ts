import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getCentralProductModel } from "../models/CentralDB/products";
import { getCentralDiscountApprovalRequestModel } from "../models/CentralDB/discountApproval";
import { getCentralStockEditRequestModel } from "../models/CentralDB/stockEditRequest";
import { getCentralEmployeeStatusRequestModel } from "../models/CentralDB/employeeStatusRequest";
import { getBranchConnection } from "../db/db";
import { getSaleModel } from "../models/BranchDB/sale";
import { getBranchStockModel } from "../models/BranchDB/stock";

// Everything here is READ-ONLY. The AI assistant is only ever given a
// summarized snapshot built from these queries — it never gets direct DB
// access, so it can't leak or corrupt anything beyond what's put together
// here on purpose.

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const buildBusinessSnapshot = async (): Promise<string> => {
  const Branch = getCentralBranchModel();
  const Product = getCentralProductModel();
  const DiscountApproval = getCentralDiscountApprovalRequestModel();
  const StockEditRequest = getCentralStockEditRequestModel();
  const EmployeeStatusRequest = getCentralEmployeeStatusRequestModel();

  const branches = await Branch.find();
  const activeBranches = branches.filter((b) => b.status === "active");

  const totalProducts = await Product.countDocuments();
  const activeProducts = await Product.countDocuments({ status: "active" });

  const pendingDiscountApprovals = await DiscountApproval.countDocuments({
    status: "pending",
  });
  const pendingStockEditRequests = await StockEditRequest.countDocuments({
    status: "PENDING",
  });
  const pendingEmployeeStatusRequests =
    await EmployeeStatusRequest.countDocuments({ status: "PENDING" });

  const todayStart = startOfToday();
  const monthStart = startOfMonth();

  let todayRevenue = 0;
  let todayTxCount = 0;
  let monthRevenue = 0;
  let monthTxCount = 0;
  const branchTodayBreakdown: string[] = [];
  const lowStockLines: string[] = [];
  const productQtyMap = new Map<string, number>(); // name -> qty sold this month

  for (const branch of branches) {
    try {
      const branchDb = getBranchConnection(branch.dbName);
      const Sale = getSaleModel(branchDb);
      const Stock = getBranchStockModel(branchDb);

      const [todaySales, monthSales, lowStock] = await Promise.all([
        Sale.find({ createdAt: { $gte: todayStart }, status: "completed" }),
        Sale.find({ createdAt: { $gte: monthStart }, status: "completed" }),
        Stock.find({ status: { $in: ["Low Stock", "Out of Stock"] } }).limit(
          20,
        ),
      ]);

      const branchTodayRevenue = todaySales.reduce(
        (sum, s) => sum + s.totalAmount,
        0,
      );
      todayRevenue += branchTodayRevenue;
      todayTxCount += todaySales.length;

      monthRevenue += monthSales.reduce((sum, s) => sum + s.totalAmount, 0);
      monthTxCount += monthSales.length;

      for (const s of monthSales) {
        for (const item of s.items) {
          productQtyMap.set(
            item.name,
            (productQtyMap.get(item.name) || 0) + item.quantity,
          );
        }
      }

      if (todaySales.length > 0 || branchTodayRevenue > 0) {
        branchTodayBreakdown.push(
          `${branch.name}: ${branchTodayRevenue.toLocaleString()} Ks (${todaySales.length} transactions)`,
        );
      }

      if (lowStock.length > 0) {
        lowStockLines.push(
          `${branch.name}: ${lowStock.length} item(s) low/out of stock`,
        );
      }
    } catch {
      // If a single branch DB has an issue, skip it rather than failing
      // the whole snapshot — the assistant should still answer with
      // whatever data is available.
      continue;
    }
  }

  const topProducts = Array.from(productQtyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty], i) => `${i + 1}. ${name} — ${qty} units`)
    .join("\n");

  const snapshot = `
=== SHOP SNAPSHOT (as of ${new Date().toLocaleString()}) ===

BRANCHES: ${branches.length} total, ${activeBranches.length} active
${branches.map((b) => `- ${b.name} (${b.code}), status: ${b.status}`).join("\n")}

PRODUCTS: ${totalProducts} total, ${activeProducts} active

TODAY'S SALES (company-wide): ${todayRevenue.toLocaleString()} Ks across ${todayTxCount} transactions
${branchTodayBreakdown.length > 0 ? branchTodayBreakdown.join("\n") : "No sales recorded yet today."}

THIS MONTH'S SALES (company-wide): ${monthRevenue.toLocaleString()} Ks across ${monthTxCount} transactions

TOP SELLING PRODUCTS THIS MONTH:
${topProducts || "No sales data yet this month."}

LOW STOCK / OUT OF STOCK WARNINGS:
${lowStockLines.length > 0 ? lowStockLines.join("\n") : "No low-stock warnings right now."}

PENDING ACTION ITEMS (need admin attention):
- Discount approval requests pending: ${pendingDiscountApprovals}
- Stock edit requests pending: ${pendingStockEditRequests}
- Employee status change requests pending: ${pendingEmployeeStatusRequests}
=== END SNAPSHOT ===
`.trim();

  return snapshot;
};
