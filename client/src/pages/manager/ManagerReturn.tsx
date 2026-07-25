import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, RotateCcw, TrendingDown, Repeat } from "lucide-react";
import { getBranchReturnsApi } from "../../services/returnService";
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

export const ManagerReturns: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [totalRefunded, setTotalRefunded] = useState(0);
  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(false);

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
   const t = setTimeout(()=>  fetchReturns(),0);
   return () => clearTimeout(t);
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
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

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {loading ? (
          <LoadingSpinner />
        ) : returns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <RotateCcw className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-500">
              No returns yet
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
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => (
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
    </div>
  );
};