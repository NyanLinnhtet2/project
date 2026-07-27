import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Loader2,
  Receipt,
  TrendingUp,
  Ban,
  Eye,
  X,
  RotateCcw,
  Copy,
  CheckCircle2,
  Search,
  Printer,
} from "lucide-react";
import { getBranchSalesApi, voidSaleApi } from "../../services/saleService";
import type { Sale } from "../../types/sale";
import { createReturnApi } from "../../services/returnService";
import type { ReturnRecord, ReturnType } from "../../types/return";
import { printReceipt } from "../../utils/printReceipt";

const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = "Loading sales...",
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
        <Ban size={12} /> Voided
      </span>
    );
  }
  if (sale.returnType === "exchange") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
        <RotateCcw size={12} /> Exchange
      </span>
    );
  }
  if (sale.returnType === "return") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
        <RotateCcw size={12} /> Returned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
      <CheckCircle2 size={12} /> Completed
    </span>
  );
};

const SaleDetailModal: React.FC<{
  sale: Sale;
  branchName: string;
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
            {new Date(sale.createdAt).toLocaleString()} · {sale.cashierName}
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
        {sale.approvedByName && (
          <p className="mt-2 text-xs text-amber-600">
            ⚠ Discount approved by manager: {sale.approvedByName}
          </p>
        )}
        {sale.linkedReturnNumber && (
          <p className="mt-2 text-xs text-blue-600">
            🔄 Exchange for {sale.linkedReturnNumber}
          </p>
        )}
      </div>
    </div>
  </div>
);

interface ReturnModalProps {
  sale: Sale;
  onClose: () => void;
  onDone: (result: ReturnRecord) => void;
}

const ReturnModal: React.FC<ReturnModalProps> = ({ sale, onClose, onDone }) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [type, setType] = useState<ReturnType>("return");
  const [submitting, setSubmitting] = useState(false);

  const setQty = (productId: string, qty: number, max: number) => {
    setQuantities((q) => ({
      ...q,
      [productId]: Math.min(Math.max(qty, 0), max),
    }));
  };

  const selectedItems = sale.items
    .map((item) => ({ item, qty: quantities[item.productId] || 0 }))
    .filter((x) => x.qty > 0);

  const estimatedRefund = (() => {
    const discountFraction =
      sale.subtotal > 0 ? sale.discountAmount / sale.subtotal : 0;
    const taxMultiplier = 1 + sale.taxRate / 100;
    return selectedItems.reduce((sum, { item, qty }) => {
      const perUnit = item.price * (1 - discountFraction) * taxMultiplier;
      return sum + Math.round(perUnit * qty);
    }, 0);
  })();

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error("Pick at least one item to return");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createReturnApi({
        originalSaleId: sale._id,
        items: selectedItems.map(({ item, qty }) => ({
          productId: item.productId,
          quantity: qty,
        })),
        reason,
        type,
      });
      if (res.success) {
        toast.success(
          type === "exchange" ? "Return recorded" : "Return completed",
        );
        onDone(res.data);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to process return");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Return / Exchange
            </h2>
            <p className="text-xs text-slate-400">{sale.saleNumber}</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Items to return
          </p>
          <div className="space-y-2">
            {sale.items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    Sold {item.quantity} × {item.price.toLocaleString()} Ks
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={item.quantity}
                  value={quantities[item.productId] || 0}
                  onChange={(e) =>
                    setQty(
                      item.productId,
                      Number(e.target.value),
                      item.quantity,
                    )
                  }
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ))}
          </div>

          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Type
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("return")}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                type === "return"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              Return (refund)
            </button>
            <button
              type="button"
              onClick={() => setType("exchange")}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                type === "exchange"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              Exchange
            </button>
          </div>

          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Reason
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. wrong size, defective item..."
            rows={2}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
            <span className="text-sm font-medium text-slate-500">
              Estimated refund
            </span>
            <span className="text-lg font-bold text-slate-800">
              {estimatedRefund.toLocaleString()} Ks
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Prorated by this sale's discount and tax — the server confirms the
            exact amount.
          </p>

          <button
            onClick={handleSubmit}
            disabled={submitting || selectedItems.length === 0}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 py-3 font-semibold text-white hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : type === "exchange" ? (
              "Record Return & Get Exchange Code"
            ) : (
              "Complete Return"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Exchange Code Modal (updated styles)
// ============================================================
const ExchangeCodeModal: React.FC<{
  returnRecord: ReturnRecord;
  onClose: () => void;
}> = ({ returnRecord, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(returnRecord.returnNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <CheckCircle2 className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">
          Return Recorded
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Give this code to the cashier — they'll enter it when ringing up the
          replacement items.
        </p>

        <button
          onClick={handleCopy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 py-4 font-mono text-xl font-bold tracking-wider text-blue-700 transition hover:bg-blue-100"
        >
          {returnRecord.returnNumber}
          {copied ? (
            <CheckCircle2 size={20} className="text-blue-600" />
          ) : (
            <Copy size={20} />
          )}
        </button>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export const ManagerSales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnSale, setReturnSale] = useState<Sale | null>(null);
  const [exchangeCode, setExchangeCode] = useState<ReturnRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    voided: 0,
    returned: 0,
  });

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await getBranchSalesApi();
      if (res.success) {
        setSales(res.data);
        setTotalRevenue(res.totalRevenue || 0);
        setBranchName(res.branchName || "");
        computeStats(res.data);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (data: Sale[]) => {
    const completed = data.filter(
      (s) => s.status === "completed" && !s.returnType,
    ).length;
    const voided = data.filter((s) => s.status === "voided").length;
    const returned = data.filter(
      (s) => s.returnType === "return" || s.returnType === "exchange",
    ).length;
    setStats({
      total: data.length,
      completed,
      voided,
      returned,
    });
  };

  React.useEffect(() => {
    const t = setTimeout(() => fetchSales(), 0);
    return () => clearTimeout(t);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSales = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((sale) =>
      [sale.saleNumber, sale.cashierName]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q)),
    );
  }, [sales, searchQuery]);

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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
                <Receipt size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Branch Sales
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  {branchName || "Select a branch"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-3.5 shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-white/90" />
              <span className="text-xs font-medium text-white/90">
                Total Revenue
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {totalRevenue.toLocaleString()} Ks
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Sales
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
                <p className="text-sm font-medium text-slate-500">Completed</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {stats.completed}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Voided</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {stats.voided}
                </p>
              </div>
              <div className="rounded-xl bg-red-50 p-3">
                <Ban size={20} className="text-red-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Returns / Exchanges
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {stats.returned}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <RotateCcw size={20} className="text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sale # or cashier..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
            />
          </div>
          <button
            onClick={fetchSales}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-md disabled:opacity-60"
          >
            <Loader2 size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Sales Table */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/50">
          {loading ? (
            <LoadingSpinner />
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-blue-50 p-4">
                <Receipt className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-600">
                No sales yet
              </h3>
              <p className="mt-2 text-slate-400">
                Sales will appear here once customers make purchases.
              </p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-slate-50 p-4">
                <Search className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-600">
                No sales match "{searchQuery}"
              </h3>
              <p className="mt-2 text-slate-400">Try adjusting your search.</p>
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
                        Cashier
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Items
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Discount
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
                          {sale.cashierName}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {sale.items.length} item
                          {sale.items.length !== 1 ? "s" : ""}
                        </td>
                        <td className="px-6 py-4">
                          {sale.discountAmount > 0 ? (
                            <span className="font-medium text-red-500">
                              -{sale.discountAmount.toLocaleString()} Ks
                            </span>
                          ) : (
                            <span className="font-medium text-red-500">
                              0 Ks
                            </span>
                          )}
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
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedSale(sale)}
                              className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100 hover:shadow-md"
                            >
                              <Eye size={14} />
                              View
                            </button>
                            {sale.canReturn && (
                              <button
                                onClick={() => setReturnSale(sale)}
                                className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-600 transition hover:bg-amber-100 hover:shadow-md"
                              >
                                <RotateCcw size={14} />
                                Return
                              </button>
                            )}
                            {sale.status === "completed" && (
                              <button
                                onClick={() => handleVoid(sale)}
                                disabled={voidingId === sale._id}
                                className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100 hover:shadow-md disabled:opacity-50"
                              >
                                {voidingId === sale._id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Ban size={14} />
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
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          branchName={branchName}
          onClose={() => setSelectedSale(null)}
        />
      )}

      {returnSale && (
        <ReturnModal
          sale={returnSale}
          onClose={() => setReturnSale(null)}
          onDone={(result) => {
            setReturnSale(null);
            fetchSales();
            if (result.type === "exchange") {
              setExchangeCode(result);
            }
          }}
        />
      )}

      {exchangeCode && (
        <ExchangeCodeModal
          returnRecord={exchangeCode}
          onClose={() => setExchangeCode(null)}
        />
      )}
    </div>
  );
};
