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
} from "lucide-react";
import { getBranchSalesApi, voidSaleApi } from "../../services/saleService";
import type { Sale } from "../../types/sale";
import { createReturnApi } from "../../services/returnService";

import type { ReturnRecord, ReturnType } from "../../types/return";

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

// Shown right after an exchange-type return is created — gives the manager
// a code to hand the cashier so the replacement sale links back to it.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-800">
          Return Recorded
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Give this code to the cashier — they'll enter it when ringing up the
          replacement items.
        </p>

        <button
          onClick={handleCopy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 py-4 font-mono text-xl font-bold tracking-wider text-emerald-700 hover:bg-emerald-100"
        >
          {returnRecord.returnNumber}
          {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
        </button>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
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
    const t = setTimeout(() => fetchSales(), 0);
    return () => clearTimeout(t);
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
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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

      <div className="mb-4 relative w-full sm:w-80">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search sale # or cashier..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:shadow-md"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {loading ? (
          <LoadingSpinner />
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-500">No sales yet</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-500">
              No sales match "{searchQuery}"
            </p>
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
              {filteredSales.map((sale) => (
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
                    <StatusBadge sale={sale} />
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
                      {sale.canReturn && (
                        <button
                          onClick={() => setReturnSale(sale)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-2.5 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50"
                        >
                          <RotateCcw size={12} />
                          Return
                        </button>
                      )}
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