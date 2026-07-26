import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Receipt,
  TrendingUp,
  Search,
  Eye,
  X,
  RefreshCw,
  DollarSign,
  Package,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { getMySalesApi } from "../../services/saleService";
import type { Sale } from "../../types/sale";

const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = "Loading your sales...",
}) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200"></div>
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-4 text-sm text-slate-500 font-medium">{label}</p>
  </div>
);

const StatusBadge: React.FC<{ sale: Sale }> = ({ sale }) => {
  if (sale.status === "voided") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
        <X size={12} /> Voided
      </span>
    );
  }
  if (sale.returnType === "exchange") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
        <ArrowRight size={12} /> Exchange
      </span>
    );
  }
  if (sale.returnType === "return") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
        <Package size={12} /> Return
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
      <CheckCircle size={12} /> Completed
    </span>
  );
};

// ============================================================
// Sale Detail Modal (updated styles)
// ============================================================
const SaleDetailModal: React.FC<{ sale: Sale; onClose: () => void }> = ({
  sale,
  onClose,
}) => (
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
            {sale.saleNumber}
          </h2>
          <p className="text-xs text-slate-500">
            {new Date(sale.createdAt).toLocaleString()}
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
                  Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Line Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item, idx) => (
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
                  <td className="px-4 py-3 text-right text-slate-600">
                    {item.price.toLocaleString()} Ks
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {(item.price * item.quantity).toLocaleString()} Ks
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 border border-slate-200/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium text-slate-900">
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
              <span className="font-medium text-slate-900">
                +{sale.taxAmount.toLocaleString()} Ks
              </span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="text-sm font-medium text-slate-500">Total</span>
            <span className="text-2xl font-bold text-slate-900">
              {sale.totalAmount.toLocaleString()} Ks
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
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

// ============================================================
// Main Component
// ============================================================
export const MySales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalSales: 0,
    totalItems: 0,
    averageAmount: 0,
  });

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await getMySalesApi();
      if (res.success) {
        setSales(res.data);
        setTotalToday(res.totalToday || 0);
        computeStats(res.data);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load your sales");
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (data: Sale[]) => {
    const totalItems = data.reduce((sum, s) => sum + s.items.length, 0);
    const totalAmount = data.reduce((sum, s) => sum + s.totalAmount, 0);
    const average = data.length > 0 ? totalAmount / data.length : 0;
    setStats({
      totalSales: data.length,
      totalItems,
      averageAmount: average,
    });
  };

  useEffect(() => {
    const t = setTimeout(() => fetchSales(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSales = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((s) => s.saleNumber.toLowerCase().includes(q));
  }, [sales, searchTerm]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
                <Receipt size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">My Sales</h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Everything you've rung up
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-3.5 shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-white/90" />
              <span className="text-xs font-medium text-white/90">
                Today's Total
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {totalToday.toLocaleString()} Ks
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Sales
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.totalSales}
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
                <p className="text-sm font-medium text-slate-500">Items Sold</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.totalItems}
                </p>
              </div>
              <div className="rounded-xl bg-indigo-50 p-3">
                <Package size={20} className="text-indigo-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Average Sale
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {stats.averageAmount.toLocaleString()} Ks
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <DollarSign size={20} className="text-emerald-600" />
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
              placeholder="Search by Sale #..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
            />
          </div>
          <button
            onClick={fetchSales}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-md disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Sales Table */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/50">
          {loading ? (
            <LoadingSpinner />
          ) : filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-blue-50 p-4">
                <Receipt className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-600">
                {sales.length === 0 ? "No sales yet" : "No matching sales"}
              </h3>
              <p className="mt-2 text-slate-400">
                {sales.length === 0
                  ? "Your sales will appear here once you ring up customers."
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
                        Sale #
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Items
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Payment
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
                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSales.map((sale) => (
                      <tr
                        key={sale._id}
                        className="transition hover:bg-slate-50/50"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {sale.saleNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {sale.items.length} item
                          {sale.items.length !== 1 ? "s" : ""}
                        </td>
                        <td className="px-6 py-4 text-sm capitalize text-slate-600">
                          {sale.paymentMethod.replace("_", " ")}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {sale.totalAmount.toLocaleString()} Ks
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge sale={sale} />
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(sale.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => setSelectedSale(sale)}
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
      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
};
