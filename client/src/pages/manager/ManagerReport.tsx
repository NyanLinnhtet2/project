import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Loader2,
  BarChart3,
  Users,
  Tag,
  Percent,
  RotateCcw,
} from "lucide-react";
import { getReportSummaryApi } from "../../services/reportService";
import { RankedBarList } from "../../components/ui/RankedBarList";
import type { ReportSummary } from "../../types/report";

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
    <p className="mt-4 text-sm text-slate-500 font-medium">Loading report...</p>
  </div>
);

const StatCard: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}> = ({ label, value, icon, accent }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <div
      className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}
    >
      {icon}
    </div>
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-0.5 text-xl font-bold text-slate-800">{value}</p>
  </div>
);

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

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
          <p className="text-sm text-slate-500">Team & sales performance</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : !report ? (
        <p className="py-16 text-center text-sm text-slate-400">
          No data available
        </p>
      ) : (
        <div className="space-y-6">
          {/* Discount & Return rate KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Total Discount Given"
              value={`${report.discountReturnRate.totalDiscount.toLocaleString()} Ks`}
              icon={<Percent size={16} className="text-white" />}
              accent="bg-amber-500"
            />
            <StatCard
              label="Discount Rate"
              value={`${report.discountReturnRate.discountRatePercent}%`}
              icon={<Percent size={16} className="text-white" />}
              accent="bg-amber-500"
            />
            <StatCard
              label="Total Refunded"
              value={`${report.discountReturnRate.totalRefund.toLocaleString()} Ks`}
              icon={<RotateCcw size={16} className="text-white" />}
              accent="bg-red-500"
            />
            <StatCard
              label="Return Rate"
              value={`${report.discountReturnRate.returnRatePercent}%`}
              icon={<RotateCcw size={16} className="text-white" />}
              accent="bg-red-500"
            />
          </div>
          <p className="-mt-3 text-xs text-slate-400">
            {report.discountReturnRate.salesWithDiscountCount} of{" "}
            {report.discountReturnRate.totalTransactions} sales had a discount ·{" "}
            {report.discountReturnRate.returnCount} return
            {report.discountReturnRate.returnCount !== 1 ? "s" : ""} processed
          </p>

          {/* Cashier performance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users size={18} className="text-emerald-600" />
              <h2 className="font-bold text-slate-800">Cashier Performance</h2>
            </div>
            {report.cashierPerformance.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No sales in this period
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="py-2">Cashier</th>
                    <th className="py-2 text-right">Revenue</th>
                    <th className="py-2 text-right">Transactions</th>
                    <th className="py-2 text-right">Avg Basket</th>
                  </tr>
                </thead>
                <tbody>
                  {report.cashierPerformance.map((c, idx) => (
                    <tr key={idx} className="border-b border-slate-50">
                      <td className="py-2.5 font-medium text-slate-700">
                        {c.cashierName}
                      </td>
                      <td className="py-2.5 text-right text-slate-700">
                        {c.totalRevenue.toLocaleString()} Ks
                      </td>
                      <td className="py-2.5 text-right text-slate-500">
                        {c.transactionCount}
                      </td>
                      <td className="py-2.5 text-right text-slate-500">
                        {c.avgBasket.toLocaleString()} Ks
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Category breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Tag size={18} className="text-emerald-600" />
              <h2 className="font-bold text-slate-800">Sales by Category</h2>
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
  );
};
