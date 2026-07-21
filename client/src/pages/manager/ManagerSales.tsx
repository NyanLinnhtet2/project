import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Receipt, TrendingUp, Ban } from "lucide-react";
import { getBranchSalesApi, voidSaleApi } from "../../services/saleService";
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

export const ManagerSales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await getBranchSalesApi();
      if (res.success) {
        setSales(res.data);
        setTotalRevenue(res.totalRevenue || 0);
        setBranchName(res.branchName || "");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchSales(), 0);
    return () => clearTimeout(t);
  }, []);

  const handleVoid = async (sale: Sale) => {
    if (
      !window.confirm(`Void sale ${sale.saleNumber}? Stock will be restored.`)
    ) {
      return;
    }
    setVoidingId(sale._id);
    try {
      const res = await voidSaleApi(sale._id, "Voided by manager");
      if (res.success) {
        toast.success("Sale voided");
        fetchSales();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to void sale");
    } finally {
      setVoidingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Branch Sales</h1>
          <p className="text-sm text-slate-500">{branchName}</p>
        </div>
        <div className="rounded-2xl bg-linear-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-white shadow-lg shadow-emerald-500/30">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} />
            <span className="text-xs font-medium opacity-90">
              Total Revenue
            </span>
          </div>
          <p className="text-xl font-bold">
            {totalRevenue.toLocaleString()} Ks
          </p>
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
                <th className="py-3">Cashier</th>
                <th className="py-3">Items</th>
                <th className="py-3">Total</th>
                <th className="py-3">Status</th>
                <th className="py-3">Time</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale._id} className="border-b border-slate-50">
                  <td className="py-3 font-medium text-slate-700">
                    {sale.saleNumber}
                  </td>
                  <td className="py-3 text-slate-500">{sale.cashierName}</td>
                  <td className="py-3 text-slate-500">
                    {sale.items.length} item
                    {sale.items.length !== 1 ? "s" : ""}
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
                  <td className="py-3 text-right">
                    {sale.status === "completed" && (
                      <button
                        onClick={() => handleVoid(sale)}
                        disabled={voidingId === sale._id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {voidingId === sale._id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Ban size={12} />
                        )}
                        Void
                      </button>
                    )}
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
