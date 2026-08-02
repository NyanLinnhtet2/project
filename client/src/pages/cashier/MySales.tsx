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
  Printer,
} from "lucide-react";
import { getMySalesApi } from "../../services/saleService";
import type { Sale } from "../../types/sale";
import { useAuth } from "../../context/useAuth";
import { printReceipt } from "../../utils/printReceipt";

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

const SaleDetailModal: React.FC<{
  sale: Sale;
  branchName?: string;
  onClose: () => void;
}> = ({ sale, branchName, onClose }) => (
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
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => printReceipt(sale, branchName)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Printer size={14} />
            Print
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
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
        {sale.couponCode && (
          <p className="mt-2 text-xs text-indigo-600">
            🎟️ Coupon {sale.couponCode}
            {sale.couponDiscountAmount
              ? ` (-${sale.couponDiscountAmount.toLocaleString()} Ks)`
              : ""}
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
  const { userInfo } = useAuth();

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

      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          branchName={userInfo?.branch}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
};