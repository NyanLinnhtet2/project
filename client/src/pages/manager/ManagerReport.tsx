import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart3,
  Users,
  Tag,
  Percent,
  RotateCcw,
  DollarSign,
  Receipt,
  ShoppingBasket,
  TrendingUp,
  CreditCard,
  Award,
  RefreshCw,
  Ticket,
} from "lucide-react";
import { getReportSummaryApi } from "../../services/reportService";
import { RankedBarList } from "../../components/ui/RankedBarList";
import { DailyTrendChart } from "../../components/ui/DailytrendChart";
import type { ReportSummary } from "../../types/report";

// ─── Loading Spinner ────────────────────────────────────────────
const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200"></div>
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-4 text-sm text-slate-500 font-medium">Loading report...</p>
  </div>
);

// ─── Stat Card ──────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
}> = ({ label, value, icon, accent }) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md border border-slate-200/50">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`rounded-xl p-3 ${accent}`}>{icon}</div>
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────
export const ManagerReports: React.FC = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await getReportSummaryApi({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.success) setReport(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchReport(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // ── derived revenue ──
  const totalRevenue = report?.kpis.netRevenue || 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
              <BarChart3 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Reports
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Team & sales performance
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-3.5 shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300 w-full sm:w-auto">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <DollarSign size={18} className="text-white/90" />
              <span className="text-xs font-medium text-white/90">
                Total Revenue
              </span>
            </div>
            <p className="text-2xl font-bold text-white text-center sm:text-left">
              {totalRevenue.toLocaleString()} Ks
            </p>
          </div>
        </div>

        {/* ─── Stats Cards ────────────────────────────────────────── */}
        {report && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Net Revenue"
              value={`${report.kpis.netRevenue.toLocaleString()} Ks`}
              icon={<DollarSign size={20} className="text-white" />}
              accent="bg-emerald-500"
            />
            <StatCard
              label="Transactions"
              value={report.kpis.totalTransactions.toLocaleString()}
              icon={<Receipt size={20} className="text-white" />}
              accent="bg-blue-500"
            />
            <StatCard
              label="Avg Basket Size"
              value={`${report.kpis.avgBasketSize.toLocaleString()} Ks`}
              icon={<ShoppingBasket size={20} className="text-white" />}
              accent="bg-purple-500"
            />
            <StatCard
              label="Total Refunded"
              value={`${report.kpis.totalRefunded.toLocaleString()} Ks`}
              icon={<RotateCcw size={20} className="text-white" />}
              accent="bg-red-500"
            />
          </div>
        )}

        {/* ─── Filters ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200/50">
          <div className="flex items-center gap-2 min-w-140px">
            <span className="text-sm text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
            />
          </div>
          <div className="flex items-center gap-2 min-w-140px">
            <span className="text-sm text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
            />
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-md disabled:opacity-60 w-full sm:w-auto"
          >
            <RefreshCw
              size={16}
              className={`text-slate-400 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* ─── Report Content ────────────────────────────────────── */}
        {loading ? (
          <LoadingSpinner />
        ) : !report ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-blue-50 p-4">
              <BarChart3 className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-600">
              No data available
            </h3>
            <p className="mt-2 text-slate-400">
              No sales data found for the selected date range.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ─── Daily Trend ────────────────────────────────────── */}
            <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Revenue Trend
                </h2>
              </div>
              <DailyTrendChart points={report.dailyTrend} />
            </div>

            {/* ─── Payment Methods & Top Products ─────────────────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard size={20} className="text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Payment Methods
                  </h2>
                </div>
                <RankedBarList
                  barColorClass="bg-blue-500"
                  items={report.paymentBreakdown.map((p) => ({
                    label: p.method.replace("_", " "),
                    sublabel: `${p.count} sale${p.count !== 1 ? "s" : ""}`,
                    value: p.amount,
                    valueLabel: `${p.amount.toLocaleString()} Ks`,
                  }))}
                  emptyMessage="No sales in this period"
                />
              </div>

              <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50">
                <div className="flex items-center gap-2 mb-4">
                  <Award size={20} className="text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Top Products
                  </h2>
                </div>
                <RankedBarList
                  barColorClass="bg-purple-500"
                  items={report.topProducts.map((p) => ({
                    label: p.name,
                    sublabel: `${p.quantity} sold`,
                    value: p.revenue,
                    valueLabel: `${p.revenue.toLocaleString()} Ks`,
                  }))}
                  emptyMessage="No sales in this period"
                />
              </div>
            </div>

            {/* ─── Discount & Return KPIs ──────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Discount Given"
                value={`${report.discountReturnRate.totalDiscount.toLocaleString()} Ks`}
                icon={<Percent size={20} className="text-white" />}
                accent="bg-amber-500"
              />
              <StatCard
                label="Discount Rate"
                value={`${report.discountReturnRate.discountRatePercent}%`}
                icon={<Percent size={20} className="text-white" />}
                accent="bg-amber-500"
              />
              <StatCard
                label="Total Refunded"
                value={`${report.discountReturnRate.totalRefund.toLocaleString()} Ks`}
                icon={<RotateCcw size={20} className="text-white" />}
                accent="bg-red-500"
              />
              <StatCard
                label="Return Rate"
                value={`${report.discountReturnRate.returnRatePercent}%`}
                icon={<RotateCcw size={20} className="text-white" />}
                accent="bg-red-500"
              />
            </div>

            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">
                {report.discountReturnRate.salesWithDiscountCount}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-700">
                {report.discountReturnRate.totalTransactions}
              </span>{" "}
              sales had a discount ·{" "}
              <span className="font-medium text-slate-700">
                {report.discountReturnRate.returnCount}
              </span>{" "}
              return
              {report.discountReturnRate.returnCount !== 1 ? "s" : ""} processed
            </p>

            {/* ─── Coupon Usage ────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Coupons Redeemed"
                value={report.couponStats.redemptionCount.toLocaleString()}
                icon={<Ticket size={20} className="text-white" />}
                accent="bg-indigo-500"
              />
              <StatCard
                label="Coupon Discount Given"
                value={`${report.couponStats.totalDiscountGiven.toLocaleString()} Ks`}
                icon={<Ticket size={20} className="text-white" />}
                accent="bg-indigo-500"
              />
              <StatCard
                label="Redemption Rate"
                value={`${report.couponStats.redemptionRatePercent}%`}
                icon={<Ticket size={20} className="text-white" />}
                accent="bg-indigo-500"
              />
            </div>
            {report.couponStats.breakdown.length > 0 && (
              <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50">
                <div className="flex items-center gap-2 mb-4">
                  <Ticket size={20} className="text-indigo-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Coupon Breakdown
                  </h2>
                </div>
                <RankedBarList
                  barColorClass="bg-indigo-500"
                  items={report.couponStats.breakdown.map((b) => ({
                    label:
                      b.type === "birthday"
                        ? "🎂 Birthday"
                        : b.type === "level_up"
                          ? "⬆️ Level-Up"
                          : b.type,
                    sublabel: `${b.count} redemption${b.count !== 1 ? "s" : ""}`,
                    value: b.discount,
                    valueLabel: `${b.discount.toLocaleString()} Ks`,
                  }))}
                  emptyMessage="No coupons redeemed in this period"
                />
              </div>
            )}

            {/* ─── Cashier Performance ────────────────────────────── */}
            <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50">
              <div className="flex items-center gap-2 mb-4">
                <Users size={20} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Cashier Performance
                </h2>
                <span className="ml-auto text-xs text-slate-400">
                  {report.cashierPerformance.length} cashiers
                </span>
              </div>

              {report.cashierPerformance.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">
                  No sales in this period
                </p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200/50">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-500px">
                      <thead className="bg-slate-50 border-b border-slate-200/50">
                        <tr>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Cashier
                          </th>
                          <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Revenue
                          </th>
                          <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Transactions
                          </th>
                          <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Avg Basket
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {report.cashierPerformance.map((c, idx) => (
                          <tr
                            key={idx}
                            className="transition hover:bg-slate-50/50"
                          >
                            <td className="px-4 sm:px-6 py-4 font-medium text-slate-900 text-sm sm:text-base">
                              {c.cashierName}
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-right font-semibold text-slate-900">
                              {c.totalRevenue.toLocaleString()} Ks
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-right text-slate-600">
                              {c.transactionCount}
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-right text-slate-600">
                              {c.avgBasket.toLocaleString()} Ks
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Sales by Category ──────────────────────────────── */}
            <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50">
              <div className="flex items-center gap-2 mb-4">
                <Tag size={20} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Sales by Category
                </h2>
                <span className="ml-auto text-xs text-slate-400">
                  {report.categoryBreakdown.length} categories
                </span>
              </div>
              <RankedBarList
                items={report.categoryBreakdown.map((c) => ({
                  label: c.category,
                  sublabel: `${c.quantity} sold`,
                  value: c.revenue,
                  valueLabel: `${c.revenue.toLocaleString()} Ks`,
                }))}
                emptyMessage="No sales in this period"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};