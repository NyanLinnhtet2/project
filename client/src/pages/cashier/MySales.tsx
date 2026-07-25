import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Receipt, TrendingUp, Search, Eye, X } from "lucide-react";
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

const StatusBadge: React.FC<{ sale: Sale }> = ({ sale }) => {
  if (sale.status === "voided") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
        Voided
      </span>
    );
  }
  if (sale.returnType === "exchange") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
        Exchange
      </span>
    );
  }
  if (sale.returnType === "return") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
        Return
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
      Completed
    </span>
  );
};

// ============================================================
// Sale detail — full data already came from getMySalesApi, no extra fetch
// ============================================================
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
            {new Date(sale.createdAt).toLocaleString()}
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
                <td className="py-2.5 text-slate-700">
                  {item.name}
                  {(item.category || item.brand) && (
                    <div className="text-xs text-slate-400">
                      {[item.category, item.brand].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </td>
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
          <StatusBadge sale={sale} />
        </div>
        {sale.linkedReturnNumber && (
          <p className="mt-2 text-xs text-blue-600">
            🔄 Exchange for {sale.linkedReturnNumber}
          </p>
        )}
      </div>
    </div>
  </div>
);

export const MySales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

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

  const filteredSales = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((s) => s.saleNumber.toLowerCase().includes(q));
  }, [sales, searchTerm]);

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

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Sale #..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-72"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {loading ? (
          <LoadingSpinner />
        ) : filteredSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-500">
              {sales.length === 0 ? "No sales yet" : "No matching sales"}
            </p>
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
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
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
                    <StatusBadge sale={sale} />
                  </td>
                  <td className="py-3 text-slate-400">
                    {new Date(sale.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => setSelectedSale(sale)}
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
