import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Receipt,
  TrendingUp,
  Store,
  RefreshCw,
  DollarSign,
  Eye,
  X,
} from "lucide-react";
import {
  getSalesOverviewApi,
  getSaleDetailApi,
} from "../../services/saleService";
import { getBranchesForDropdownApi } from "../../services/branchService";
import type { BranchSalesBreakdown, Sale, SaleSummary } from "../../types/sale";

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

// ============================================================
// Sale Detail Modal — what products were actually sold, plus
// the discount/tax breakdown for that specific sale
// ============================================================
interface SaleDetailModalProps {
  saleId: string;
  branchId: string;
  onClose: () => void;
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({
  saleId,
  branchId,
  onClose,
}) => {
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await getSaleDetailApi(saleId, branchId);
        if (!cancelled && res.success) setSale(res.data);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(
          err.response?.data?.message ?? "Failed to load sale detail",
        );
        onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetail();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleId, branchId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {sale?.saleNumber || "Sale Detail"}
            </h2>
            {sale && (
              <p className="text-xs text-slate-400">
                {new Date(sale.createdAt).toLocaleString()} · {sale.cashierName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading sale..." />
        ) : !sale ? (
          <p className="py-12 text-center text-sm text-slate-400">
            Sale not found
          </p>
        ) : (
          <div className="px-6 py-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="py-2">Product</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-50">
                    <td className="py-2.5 text-slate-700">{item.name}</td>
                    <td className="py-2.5 text-center text-slate-500">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 text-right text-slate-500">
                      {item.price.toLocaleString()} Ks
                    </td>
                    <td className="py-2.5 text-right font-medium text-slate-700">
                      {(item.price * item.quantity).toLocaleString()} Ks
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-700">
                  {sale.subtotal.toLocaleString()} Ks
                </span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Discount
                    {sale.discountType === "percent"
                      ? ` (${sale.discountValue}%)`
                      : ""}
                  </span>
                  <span className="font-medium text-red-500">
                    -{sale.discountAmount.toLocaleString()} Ks
                  </span>
                </div>
              )}
              {sale.taxAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tax ({sale.taxRate}%)</span>
                  <span className="font-medium text-slate-700">
                    +{sale.taxAmount.toLocaleString()} Ks
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                <span className="text-sm font-medium text-slate-500">
                  Total
                </span>
                <span className="text-xl font-bold text-slate-800">
                  {sale.totalAmount.toLocaleString()} Ks
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Payment: {sale.paymentMethod.replace("_", " ")}</span>
              <StatusBadge status={sale.status} />
            </div>
            {sale.approvedByName && (
              <p className="mt-2 text-xs text-amber-600">
                ⚠ Discount approved by manager: {sale.approvedByName}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
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

  const [selectedSale, setSelectedSale] = useState<{
    id: string;
    branchId: string;
  } | null>(null);

  const fetchBranches = async () => {
    try {
      const res = await getBranchesForDropdownApi();
      if (res.success) setBranches(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to fetch Branches");
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
            <Store size={18} className="text-blue-600" />
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
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Store size={16} className="text-blue-600" />
                  </div>
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
                        Subtotal
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Discount
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
                      <th className="px-6 py-4"></th>
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
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {s.subtotal.toLocaleString()} Ks
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {s.discountAmount > 0 ? (
                            <span className="font-medium text-red-500">
                              -{s.discountAmount.toLocaleString()} Ks
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
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
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              setSelectedSale({
                                id: s.saleId,
                                branchId: s.branchId,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                          >
                            <Eye size={12} />
                            View
                          </button>
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

      {selectedSale && (
        <SaleDetailModal
          saleId={selectedSale.id}
          branchId={selectedSale.branchId}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
};
