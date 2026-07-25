import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Loader2,
  RotateCcw,
  TrendingDown,
  Repeat,
  Search,
  X,
} from "lucide-react";
import {
  getBranchReturnsApi,
  getReturnDetailApi,
} from "../../services/returnService";
import type { ReturnRecord } from "../../types/return";

const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = "Loading...",
}) => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
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
    {type === "exchange" ? <Repeat size={11} /> : <RotateCcw size={11} />}
    {type === "exchange" ? "Exchange" : "Return"}
  </span>
);

// ============================================================
// Return Detail Modal — fetches the full record with line items
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

export const ManagerReturns: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [totalRefunded, setTotalRefunded] = useState(0);
  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReturn, setSelectedReturn] = useState<{
    id: string;
    branchId: string;
  } | null>(null);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await getBranchReturnsApi();
      if (res.success) {
        setReturns(res.data);
        setTotalRefunded(res.totalRefunded || 0);
        setBranchName(res.branchName || "");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load returns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchReturns(), 0);
    return () => clearTimeout(t);
  }, []);

  const filteredReturns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return returns;
    return returns.filter((r) =>
      [r.returnNumber, r.originalSaleNumber, r.processedByName, r.cashierName]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q)),
    );
  }, [returns, searchQuery]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Returns & Exchanges
          </h1>
          <p className="text-sm text-slate-500">{branchName}</p>
        </div>
        <div className="rounded-2xl bg-linear-to-r from-amber-500 to-amber-600 px-5 py-3 text-white shadow-lg shadow-amber-500/30">
          <div className="flex items-center gap-2">
            <TrendingDown size={18} />
            <span className="text-xs font-medium opacity-90">
              Total Refunded
            </span>
          </div>
          <p className="text-xl font-bold">
            {totalRefunded.toLocaleString()} Ks
          </p>
        </div>
      </div>

      <div className="mb-4 relative w-full sm:w-80">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search return #, sale #, processed by..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-amber-500 focus:bg-white focus:shadow-md"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {loading ? (
          <LoadingSpinner />
        ) : returns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <RotateCcw className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-500">No returns yet</p>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-500">
              No returns match "{searchQuery}"
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="py-3">Return #</th>
                <th className="py-3">Original Sale</th>
                <th className="py-3">Type</th>
                <th className="py-3">Items</th>
                <th className="py-3">Refund</th>
                <th className="py-3">Processed By</th>
                <th className="py-3">Time</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map((r) => (
                <tr key={r._id} className="border-b border-slate-50">
                  <td className="py-3 font-medium text-slate-700">
                    {r.returnNumber}
                  </td>
                  <td className="py-3 text-slate-500">
                    {r.originalSaleNumber}
                  </td>
                  <td className="py-3">
                    <TypeBadge type={r.type} />
                  </td>
                  <td className="py-3 text-slate-500">
                    {r.items.length} item{r.items.length !== 1 ? "s" : ""}
                  </td>
                  <td className="py-3 font-semibold text-amber-600">
                    -{r.refundAmount.toLocaleString()} Ks
                  </td>
                  <td className="py-3 text-slate-500">{r.processedByName}</td>
                  <td className="py-3 text-slate-400">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
