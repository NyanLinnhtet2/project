import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Building2,
  Boxes,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  Store,
  Activity,
  Clock,
  Cake,
  AlertTriangle,
  Ban,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { getDashboardOverviewApi } from "../../services/dashboardService";
import { getBranchesForDropdownApi } from "../../services/branchService";
import { RankedBarList } from "../../components/ui/RankedBarList";
import { DonutChart } from "../../components/ui/DonutChart";
import { AreaTrendChart } from "../../components/ui/Areatrendchart";
import type { DashboardOverview } from "../../types/dashboard";

interface BranchOption {
  _id: string;
  name: string;
}

// ─── Loading Spinner ────────────────────────────────────────────
const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200"></div>
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-4 text-sm text-slate-500 font-medium">
      Loading overview...
    </p>
  </div>
);

// ─── Empty State ────────────────────────────────────────────────
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="rounded-full bg-blue-50 p-4">
      <Activity className="h-12 w-12 text-blue-500" />
    </div>
    <h3 className="mt-4 text-xl font-semibold text-slate-600">
      No data available
    </h3>
    <p className="mt-2 text-slate-400">
      No sales data found for the selected branch or period.
    </p>
  </div>
);

// ─── Stat Card ──────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  link?: string;
}> = ({ label, value, icon, accent, link }) => {
  const card = (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-4 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 border border-slate-200/50">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-linear-to-br from-slate-100 to-transparent opacity-50"></div>
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <h2 className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-900">
            {value}
          </h2>
        </div>
        <div
          className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl ${accent}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
  return link ? <Link to={link}>{card}</Link> : card;
};

// ─── Main Component ─────────────────────────────────────────────
export const Overview = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchId, setBranchId] = useState("");
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
    if (!userInfo || userInfo.role !== "admin") {
      navigate("/");
    }
  }, [navigate]);

  const fetchBranches = async () => {
    try {
      const res = await getBranchesForDropdownApi();
      if (res.success) setBranches(res.data);
    } catch {
      // dropdown is optional
    }
  };

  const fetchOverview = async () => {
    setLoading(true);
    setHasError(false);
    try {
      const res = await getDashboardOverviewApi(branchId || undefined);
      if (res.success) {
        setData(res.data);
      } else {
        setHasError(true);
        toast.error(res.message || "Failed to load overview");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load overview");
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchBranches(), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchOverview(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Dashboard Overview
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Monitor all branches, products and sales performance
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="flex-1 sm:flex-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 shadow-sm"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              onClick={fetchOverview}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 flex-1 sm:flex-none"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              to="/admin/reports"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300 active:scale-95 w-full sm:w-auto"
            >
              <BarChart3 size={18} />
              Full Reports
            </Link>
          </div>
        </div>

        {/* ─── Content ────────────────────────────────────────────── */}
        {loading ? (
          <LoadingSpinner />
        ) : hasError || !data ? (
          <EmptyState />
        ) : (
          <>
            {/* ─── Today's Stats ────────────────────────────────────── */}
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Today's Revenue"
                value={`${data.today.revenue.toLocaleString()} Ks`}
                icon={<DollarSign className="h-6 w-6 sm:h-7 sm:w-7 text-white" />}
                accent="bg-linear-to-br from-emerald-500 to-emerald-600"
              />
              <StatCard
                label="Today's Sales"
                value={data.today.transactions.toLocaleString()}
                icon={<ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7 text-white" />}
                accent="bg-linear-to-br from-violet-500 to-violet-600"
              />
              <StatCard
                label="Today's Avg Basket"
                value={`${data.today.avgBasket.toLocaleString()} Ks`}
                icon={<TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-white" />}
                accent="bg-linear-to-br from-blue-500 to-blue-600"
              />
              <StatCard
                label="Pending Approvals"
                value={data.counts.pendingApprovals.toLocaleString()}
                icon={<Clock className="h-6 w-6 sm:h-7 sm:w-7 text-white" />}
                accent="bg-linear-to-br from-orange-500 to-orange-600"
                link="/admin/approvals"
              />
            </div>

            {/* ─── Quick Counts ────────────────────────────────────── */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard
                label="Branches"
                value={data.counts.totalBranches.toLocaleString()}
                icon={<Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
                accent="bg-slate-500"
              />
              <StatCard
                label="Products"
                value={data.counts.totalProducts.toLocaleString()}
                icon={<Boxes className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
                accent="bg-slate-500"
                link="/admin/products"
              />
              <StatCard
                label="Customers"
                value={data.counts.totalCustomers.toLocaleString()}
                icon={<Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
                accent="bg-slate-500"
                link="/admin/customers"
              />
              <StatCard
                label="Birthdays Today"
                value={data.counts.birthdaysToday.toLocaleString()}
                icon={<Cake className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
                accent="bg-amber-500"
                link="/admin/customers"
              />
              <StatCard
                label="Low Stock"
                value={data.counts.lowStockCount.toLocaleString()}
                icon={<AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
                accent="bg-red-500"
                link="/admin/inventory"
              />
            </div>

            {/* ─── Trend + Branch Performance ──────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Revenue Trend
                    </h2>
                    <p className="text-sm text-slate-500">Last 7 days</p>
                  </div>
                </div>
                <div className="mt-4">
                  <AreaTrendChart
                    points={data.weeklyTrend.map((p) => ({
                      date: p.date,
                      value: p.revenue,
                    }))}
                    valueFormatter={(v) => `${v.toLocaleString()} Ks`}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Branch Performance
                    </h2>
                    <p className="text-sm text-slate-500">This week</p>
                  </div>
                  <Store className="h-5 w-5 text-slate-400" />
                </div>
                <div className="mt-4">
                  <RankedBarList
                    barColorClass="bg-blue-500"
                    items={data.branchComparison.map((b) => ({
                      label: b.branchName,
                      sublabel: `${b.transactionCount} sale${b.transactionCount !== 1 ? "s" : ""}`,
                      value: b.revenue,
                      valueLabel: `${b.revenue.toLocaleString()} Ks`,
                    }))}
                    emptyMessage="No sales this week"
                  />
                </div>
              </div>
            </div>

            {/* ─── Pie Charts ───────────────────────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                  Payment Methods
                </h2>
                <DonutChart
                  items={data.paymentBreakdown.map((p) => ({
                    label: p.method.replace("_", " "),
                    value: p.amount,
                  }))}
                  centerLabel="This week"
                  centerValue={`${data.paymentBreakdown
                    .reduce((s, p) => s + p.amount, 0)
                    .toLocaleString()} Ks`}
                  valueFormatter={(v) => `${v.toLocaleString()} Ks`}
                  emptyMessage="No sales this week"
                />
              </div>

              <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                  Sales by Category
                </h2>
                <DonutChart
                  items={data.categoryBreakdown.map((c) => ({
                    label: c.category,
                    value: c.revenue,
                  }))}
                  centerLabel="This week"
                  centerValue={`${data.categoryBreakdown
                    .reduce((s, c) => s + c.revenue, 0)
                    .toLocaleString()} Ks`}
                  valueFormatter={(v) => `${v.toLocaleString()} Ks`}
                  emptyMessage="No sales this week"
                />
              </div>
            </div>

            {/* ─── Recent Sales + Top Products ────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Recent Sales
                  </h2>
                  <ShoppingCart className="h-5 w-5 text-slate-400" />
                </div>
                <div className="mt-4 space-y-3">
                  {data.recentSales.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-400">
                      No recent sales
                    </p>
                  ) : (
                    data.recentSales.map((sale) => (
                      <div
                        key={sale.saleNumber}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {sale.saleNumber}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-500">
                            {sale.cashierName} · {sale.branchName}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-slate-900 text-sm sm:text-base">
                            {sale.totalAmount.toLocaleString()} Ks
                          </p>
                          {sale.status === "voided" ? (
                            <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                              <Ban size={12} /> Voided
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50">
                <h2 className="text-lg font-semibold text-slate-900">
                  Top Products
                </h2>
                <p className="text-sm text-slate-500">This week</p>
                <div className="mt-4">
                  <RankedBarList
                    barColorClass="bg-purple-500"
                    items={data.topProducts.map((p) => ({
                      label: p.name,
                      sublabel: `${p.quantity} sold`,
                      value: p.revenue,
                      valueLabel: `${p.revenue.toLocaleString()} Ks`,
                    }))}
                    emptyMessage="No sales this week"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};