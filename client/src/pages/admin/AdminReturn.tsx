import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  RotateCcw,
  TrendingDown,
  Store,
  RefreshCw,
  Eye,
  X,
  Repeat,
} from "lucide-react";
import {
  getReturnsOverviewApi,
  getReturnDetailApi,
} from "../../services/returnService";
import { getBranchesForDropdownApi } from "../../services/branchService";
import type {
  ReturnBranchBreakdown,
  ReturnRecord,
  ReturnSummary,
} from "../../types/return";

interface BranchOption {
  _id: string;
  name: string;
}

const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = "Loading returns...",
}) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200"></div>
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-4 text-sm text-slate-500 font-medium">{label}</p>
  </div>
);

const TypeBadge: React.FC<{ type: ReturnSummary["type"] }> = ({ type }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
      type === "exchange"
        ? "bg-blue-100 text-blue-700"
        : "bg-amber-100 text-amber-700"
    }`}
  >
    {type === "exchange" ? <Repeat size={11} /> : <RotateCcw size={11} />}
    {type === "exchange" ? "Exchange" : "Return"}
  </span>
);

// ============================================================
// Return Detail Modal — fetches full line items from the branch DB
// ============================================================
interface ReturnDetailModalProps {
  returnId: string;
  branchId: string;
  onClose: () => void;
}

const ReturnDetailModal: React.FC<ReturnDetailModalProps> = ({
  returnId,
  branchId,
  onClose,
}) => {
  const [returnDoc, setReturnDoc] = useState<ReturnRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await getReturnDetailApi(returnId, branchId);
        if (!cancelled && res.success) setReturnDoc(res.data);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(
          err.response?.data?.message ?? "Failed to load return detail",
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
  }, [returnId, branchId]);

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
              {returnDoc?.returnNumber || "Return Detail"}
            </h2>
            {returnDoc && (
              <p className="text-xs text-slate-400">
                {new Date(returnDoc.createdAt).toLocaleString()} · for{" "}
                {returnDoc.originalSaleNumber}
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
          <LoadingSpinner label="Loading return..." />
        ) : !returnDoc ? (
          <p className="py-12 text-center text-sm text-slate-400">
            Return not found
          </p>
        ) : (
          <div className="px-6 py-4">
            <div className="mb-3">
              <TypeBadge type={returnDoc.type} />
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="py-2">Product</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Refund</th>
                </tr>
              </thead>
              <tbody>
                {returnDoc.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-50">
                    <td className="py-2.5 text-slate-700">
                      {item.name}
                      {(item.category || item.brand) && (
                        <div className="text-xs text-slate-400">
                          {[item.category, item.brand]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 text-center text-slate-500">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 text-right font-medium text-amber-600">
                      -{item.refundAmount.toLocaleString()} Ks
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <span className="text-sm font-medium text-slate-500">
                Total Refund
              </span>
              <span className="text-xl font-bold text-amber-600">
                -{returnDoc.refundAmount.toLocaleString()} Ks
              </span>
            </div>

            {returnDoc.reason && (
              <p className="mt-3 text-sm text-slate-500">
                <span className="font-medium text-slate-600">Reason: </span>
                {returnDoc.reason}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-400">
              Processed by {returnDoc.processedByName} · Original cashier:{" "}
              {returnDoc.cashierName}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminReturns: React.FC = () => {
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchId, setBranchId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [summaries, setSummaries] = useState<ReturnSummary[]>([]);
  const [totalRefunded, setTotalRefunded] = useState(0);
  const [byBranch, setByBranch] = useState<ReturnBranchBreakdown[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedReturn, setSelectedReturn] = useState<{
    id: string;
    branchId: string;
  } | null>(null);

  const fetchBranches = async () => {
    try {
      const res = await getBranchesForDropdownApi();
      if (res.success) setBranches(res.data);
    } catch {
      // dropdown is a nice-to-have; overview still works without it
    }
  };

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await getReturnsOverviewApi({
        branchId: branchId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.success) {
        setSummaries(res.data);
        setTotalRefunded(res.totalRefunded || 0);
        setByBranch(res.byBranch || []);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message ?? "Failed to load returns overview",
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-amber-50/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 p-2.5 shadow-lg shadow-amber-200">
                <RotateCcw size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Returns & Exchanges
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Across all branches
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-linear-to-r from-amber-500 to-amber-600 px-6 py-3.5 shadow-lg shadow-amber-200">
            <div className="flex items-center gap-2">
              <TrendingDown size={18} className="text-white/90" />
              <span className="text-xs font-medium text-white/90">
                Total Refunded
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {totalRefunded.toLocaleString()} Ks
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
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition focus:border-amber-500 focus:bg-white focus:shadow-md sm:flex-none"
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
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:bg-white focus:shadow-md"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:bg-white focus:shadow-md"
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
                <p className="mt-2 text-2xl font-bold text-amber-600">
                  -{b.total.toLocaleString()} Ks
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {b.count} return{b.count !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Returns Table */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/50">
          {loading ? (
            <LoadingSpinner />
          ) : summaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-amber-50 p-4">
                <RotateCcw className="h-12 w-12 text-amber-500" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-600">
                No returns found
              </h3>
              <p className="mt-2 text-slate-400">
                No return records found for the selected filters.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/50">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Return #
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Branch
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Original Sale
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Items
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Refund
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Processed By
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Time
                      </th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summaries.map((r) => (
                      <tr
                        key={r._id}
                        className="transition hover:bg-slate-50/50"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {r.returnNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {r.branchName}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {r.originalSaleNumber}
                        </td>
                        <td className="px-6 py-4">
                          <TypeBadge type={r.type} />
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {r.itemCount}
                        </td>
                        <td className="px-6 py-4 font-semibold text-amber-600">
                          -{r.refundAmount.toLocaleString()} Ks
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {r.processedByName}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              setSelectedReturn({
                                id: r.returnId,
                                branchId: r.branchId,
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

      {selectedReturn && (
        <ReturnDetailModal
          returnId={selectedReturn.id}
          branchId={selectedReturn.branchId}
          onClose={() => setSelectedReturn(null)}
        />
      )}
    </div>
  );
};
