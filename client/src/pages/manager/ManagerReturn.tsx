import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  RotateCcw,
  TrendingDown,
  Repeat,
  Search,
  Eye,
  X,
  RefreshCw,
  Receipt,
  ArrowLeftRight,
  Package,
} from "lucide-react";
import { getBranchReturnsApi } from "../../services/returnService";
import type { ReturnRecord } from "../../types/return";

const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = "Loading returns...",
}) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200"></div>
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-4 text-sm text-slate-500 font-medium">{label}</p>
  </div>
);

const TypeBadge: React.FC<{ type: ReturnRecord["type"] }> = ({ type }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
      type === "exchange"
        ? "bg-blue-100 text-blue-700"
        : "bg-amber-100 text-amber-700"
    }`}
  >
    {type === "exchange" ? <Repeat size={12} /> : <RotateCcw size={12} />}
    {type === "exchange" ? "Exchange" : "Return"}
  </span>
);

const ReturnDetailModal: React.FC<{
  returnRecord: ReturnRecord;
  onClose: () => void;
}> = ({ returnRecord, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <div
      className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {returnRecord.returnNumber}
          </h2>
          <p className="text-xs text-slate-500">
            {new Date(returnRecord.createdAt).toLocaleString()} · for{" "}
            {returnRecord.originalSaleNumber}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 transition hover:bg-slate-100"
        >
          <X size={20} className="text-slate-500" />
        </button>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <TypeBadge type={returnRecord.type} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/50">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Product
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Qty
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Refund
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returnRecord.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    {(item.category || item.brand) && (
                      <p className="text-xs text-slate-400">
                        {[item.category, item.brand]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-amber-600">
                    -{item.refundAmount.toLocaleString()} Ks
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-200/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Total Refund
            </span>
            <span className="text-2xl font-bold text-amber-600">
              -{returnRecord.refundAmount.toLocaleString()} Ks
            </span>
          </div>
        </div>

        {returnRecord.reason && (
          <p className="mt-3 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Reason: </span>
            {returnRecord.reason}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Processed by {returnRecord.processedByName} · Original cashier:{" "}
          {returnRecord.cashierName}
        </p>
      </div>
    </div>
  </div>
);

// ============================================================
// Main Component
// ============================================================
export const ManagerReturns: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [totalRefunded, setTotalRefunded] = useState(0);
  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReturn, setSelectedReturn] = useState<ReturnRecord | null>(
    null,
  );

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    exchanges: 0,
    returns: 0,
    refundAmount: 0,
  });

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await getBranchReturnsApi();
      if (res.success) {
        setReturns(res.data);
        setTotalRefunded(res.totalRefunded || 0);
        setBranchName(res.branchName || "");
        computeStats(res.data);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load returns");
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (data: ReturnRecord[]) => {
    const exchanges = data.filter((r) => r.type === "exchange").length;
    const returns = data.filter((r) => r.type === "return").length;
    const refundAmount = data.reduce((sum, r) => sum + r.refundAmount, 0);
    setStats({
      total: data.length,
      exchanges,
      returns,
      refundAmount,
    });
  };

  useEffect(() => {
    const t = setTimeout(() => fetchReturns(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredReturns = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return returns;
    return returns.filter(
      (r) =>
        r.returnNumber.toLowerCase().includes(q) ||
        r.originalSaleNumber.toLowerCase().includes(q),
    );
  }, [returns, searchTerm]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
                <RotateCcw size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Returns & Exchanges
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  {branchName || "Select a branch"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-3.5 shadow-lg  shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Returns
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <Receipt size={20} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Refund Amount
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {stats.refundAmount.toLocaleString()} Ks
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <TrendingDown size={20} className="text-amber-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Exchanges</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {stats.exchanges}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <ArrowLeftRight size={20} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Returns</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {stats.returns}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <Package size={20} className="text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Refresh */}
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Return # or Sale #..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
            />
          </div>
          <button
            onClick={fetchReturns}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-md disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Returns Table */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/50">
          {loading ? (
            <LoadingSpinner />
          ) : filteredReturns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-blue-50 p-4">
                <RotateCcw className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-600">
                {returns.length === 0
                  ? "No returns yet"
                  : "No matching returns"}
              </h3>
              <p className="mt-2 text-slate-400">
                {returns.length === 0
                  ? "Returns will appear here once customers return items."
                  : "Try adjusting your search."}
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
                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReturns.map((r) => (
                      <tr
                        key={r._id}
                        className="transition hover:bg-slate-50/50"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {r.returnNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {r.originalSaleNumber}
                        </td>
                        <td className="px-6 py-4">
                          <TypeBadge type={r.type} />
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {r.items.length} item{r.items.length !== 1 ? "s" : ""}
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
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => setSelectedReturn(r)}
                              className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100 hover:shadow-md"
                            >
                              <Eye size={14} />
                              View
                            </button>
                          </div>
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

      {/* Detail Modal */}
      {selectedReturn && (
        <ReturnDetailModal
          returnRecord={selectedReturn}
          onClose={() => setSelectedReturn(null)}
        />
      )}
    </div>
  );
};
