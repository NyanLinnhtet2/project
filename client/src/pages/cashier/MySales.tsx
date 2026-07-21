import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Receipt, TrendingUp } from "lucide-react";
import { getMySalesApi } from "../../services/saleService";
import type { Sale } from "../../types/sale";

const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = "Loading...",
}) => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
    <p className="mt-4 text-sm text-slate-500 font-medium">{label}</p>
  </div>
);

const StatusBadge: React.FC<{ status: Sale["status"] }> = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
      status === "completed"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-red-100 text-red-700"
    }`}
  >
    {status === "completed" ? "Completed" : "Voided"}
  </span>
);

export const MySales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await getMySalesApi();
      if (res.success) {
        setSales(res.data);
        setTotalToday(res.totalToday || 0);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load your sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchSales(), 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Sales</h1>
          <p className="text-sm text-slate-500">Everything you've rung up</p>
        </div>
        <div className="rounded-2xl bg-linear-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-white shadow-lg shadow-emerald-500/30">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} />
            <span className="text-xs font-medium opacity-90">
              Today's Total
            </span>
          </div>
          <p className="text-xl font-bold">{totalToday.toLocaleString()} Ks</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {loading ? (
          <LoadingSpinner />
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-500">No sales yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="py-3">Sale #</th>
                <th className="py-3">Items</th>
                <th className="py-3">Payment</th>
                <th className="py-3">Total</th>
                <th className="py-3">Status</th>
                <th className="py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale._id} className="border-b border-slate-50">
                  <td className="py-3 font-medium text-slate-700">
                    {sale.saleNumber}
                  </td>
                  <td className="py-3 text-slate-500">
                    {sale.items.length} item
                    {sale.items.length !== 1 ? "s" : ""}
                  </td>
                  <td className="py-3 capitalize text-slate-500">
                    {sale.paymentMethod.replace("_", " ")}
                  </td>
                  <td className="py-3 font-semibold text-slate-700">
                    {sale.totalAmount.toLocaleString()} Ks
                  </td>
                  <td className="py-3">
                    <StatusBadge status={sale.status} />
                  </td>
                  <td className="py-3 text-slate-400">
                    {new Date(sale.createdAt).toLocaleTimeString()}
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
