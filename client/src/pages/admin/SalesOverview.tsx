import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Receipt,
  TrendingUp,
  Store,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import { getSalesOverviewApi } from "../../services/saleService";
import { getBranchesForDropdownApi } from "../../services/branchService";
import type { BranchSalesBreakdown, SaleSummary } from "../../types/sale";

interface BranchOption {
  _id: string;
  name: string;
}

const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = "Loading sales data...",
}) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200"></div>
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-4 text-sm text-slate-500 font-medium">{label}</p>
  </div>
);

const StatusBadge: React.FC<{ status: SaleSummary["status"] }> = ({
  status,
}) => {
  const getStatus = (s: string) => {
    if (s === "completed") {
      return {
        label: "Completed",
        className: "bg-emerald-100 text-emerald-700",
        icon: "✅",
      };
    }
    return {
      label: "Voided",
      className: "bg-red-100 text-red-700",
      icon: "❌",
    };
  };

  const statusInfo = getStatus(status);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${statusInfo.className}`}
    >
      {statusInfo.icon} {statusInfo.label}
    </span>
  );
};

export const SalesOverview: React.FC = () => {
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchId, setBranchId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [summaries, setSummaries] = useState<SaleSummary[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [byBranch, setByBranch] = useState<BranchSalesBreakdown[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBranches = async () => {
    try {
      const res = await getBranchesForDropdownApi();
      if (res.success) setBranches(res.data);
    } catch {
      // dropdown is a nice-to-have; sales overview still works without it
    }
  };

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await getSalesOverviewApi({
        branchId: branchId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.success) {
        setSummaries(res.data);
        setTotalRevenue(res.totalRevenue || 0);
        setByBranch(res.byBranch || []);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message ?? "Failed to load sales overview",
      );
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
  }, [branchId, startDate, endDate]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Sales Overview
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Track and manage sales across all branches
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-3.5 shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-white/90" />
              <span className="text-xs font-medium text-white/90">
                Total Revenue
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {totalRevenue.toLocaleString()} Ks
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-200/50">
          <div className="flex items-center gap-2">
            <Store size={18} className="text-slate-400" />
            <label className="font-medium text-slate-700">Branch:</label>
          </div>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md sm:flex-none"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
            />
          </div>

          <button
            onClick={fetchOverview}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-md disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={`text-slate-400 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Per-branch breakdown */}
        {byBranch.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {byBranch.map((b) => (
              <div
                key={b.branchName}
                className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/50 transition hover:shadow-md"
              >
                <div className="flex items-center gap-2 text-slate-400">
                  <Store size={16} />
                  <span className="text-sm font-medium text-slate-600">
                    {b.branchName}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {b.total.toLocaleString()} Ks
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {b.count} sale{b.count !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Sales Table */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/50">
          {loading ? (
            <LoadingSpinner />
          ) : summaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-blue-50 p-4">
                <Receipt className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-600">
                No sales found
              </h3>
              <p className="mt-2 text-slate-400">
                No sales records found for the selected filters.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/50">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Sale #
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Branch
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Cashier
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Items
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Total
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summaries.map((s) => (
                      <tr
                        key={s._id}
                        className="transition hover:bg-slate-50/50"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {s.saleNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {s.branchName}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {s.cashierName}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {s.itemCount}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {s.totalAmount.toLocaleString()} Ks
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(s.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
