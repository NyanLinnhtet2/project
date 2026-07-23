import React, { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Receipt, TrendingUp, Ban, Eye, X } from "lucide-react";
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

// The list endpoint already returns the full Sale (items, subtotal,
// discount, tax) — no need to fetch again just to show the detail modal.
const SaleDetailModal: React.FC<{ sale: Sale; onClose: () => void }> = ({
  sale,
  onClose,
}) => (
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
            {sale.saleNumber}
          </h2>
          <p className="text-xs text-slate-400">
            {new Date(sale.createdAt).toLocaleString()} · {sale.cashierName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      </div>

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
            <span className="text-sm font-medium text-slate-500">Total</span>
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
    </div>
  </div>
);

export const ManagerSales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

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

  React.useEffect(() => {
    const t = setTimeout(() => {
      fetchSales();
    }, 0);

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
                <th className="py-3">Discount</th>
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
                  <td className="py-3">
                    {sale.discountAmount > 0 ? (
                      <span className="font-medium text-red-500">
                        -{sale.discountAmount.toLocaleString()} Ks
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
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
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        <Eye size={12} />
                        View
                      </button>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
};
