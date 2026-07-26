import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Loader2,
  PackageX,
  Clock,
  X,
  CreditCard,
} from "lucide-react";
import { getBranchInventoryApi } from "../../services/inventoryService";
import { createSaleApi } from "../../services/saleService";
import { getEffectiveDiscountCapApi } from "../../services/discountEventService";
import {
  createDiscountApprovalRequestApi,
  getMyLatestApprovalRequestApi,
  cancelApprovalRequestApi,
} from "../../services/discountApprovalService";
import type { Stock } from "../../types/inventory";
import type { Product } from "../../types/product";
import type { CartLine, DiscountType, PaymentMethod } from "../../types/sale";
import type { DiscountApprovalRequest } from "../../types/discountApprovalRequest";
import { useAuth } from "../../context/useAuth";

interface StockWithProduct extends Stock {
  product?: Product;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "kbz_pay", label: "KBZPay" },
  { value: "wave_pay", label: "WavePay" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

const getProduct = (stock: Stock): Product | null => {
  const item = stock as StockWithProduct;
  if (item.product) return item.product;
  if (typeof stock.productId === "object" && stock.productId !== null) {
    return stock.productId as unknown as Product;
  }
  return null;
};

const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = "Loading...",
}) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200"></div>
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-4 text-sm text-slate-500 font-medium">{label}</p>
  </div>
);

export const NewSale: React.FC = () => {
  const { userInfo } = useAuth();
  const branchId = userInfo?.branch || "";

  const [stockList, setStockList] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [discountType, setDiscountType] = useState<DiscountType>("amount");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [checkingOut, setCheckingOut] = useState(false);
  const [discountCapPercent, setDiscountCapPercent] = useState<
    number | undefined
  >(undefined);
  const [discountCapEventName, setDiscountCapEventName] = useState<
    string | undefined
  >(undefined);

  const fetchInventory = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await getBranchInventoryApi(branchId);
      if (res.success) setStockList(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscountCap = async () => {
    try {
      const res = await getEffectiveDiscountCapApi();
      if (res.success) {
        setDiscountCapPercent(res.data.capPercent);
        setDiscountCapEventName(
          res.data.source === "event" ? res.data.eventName : undefined,
        );
      }
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchInventory();
      fetchDiscountCap();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const availableStock = useMemo(
    () =>
      stockList.filter((s) => {
        const product = getProduct(s);
        if (!product || s.quantity <= 0) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          product.name.toLowerCase().includes(q) ||
          product.sku.toLowerCase().includes(q)
        );
      }),
    [stockList, search],
  );

  const cartQuantity = (productId: string) =>
    cart.find((c) => c.product._id === productId)?.quantity || 0;

  const stockFor = (productId: string) =>
    stockList.find((s) => getProduct(s)?._id === productId)?.quantity ?? 0;

  const addToCart = (stock: Stock) => {
    const product = getProduct(stock);
    if (!product) return;

    const inCart = cartQuantity(product._id);
    if (inCart >= stock.quantity) {
      toast.error(`Only ${stock.quantity} left in stock`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((c) => c.product._id === product._id);
      if (existing) {
        return prev.map((c) =>
          c.product._id === product._id
            ? { ...c, quantity: c.quantity + 1 }
            : c,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const changeQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.product._id !== productId) return c;
          const next = c.quantity + delta;
          if (delta > 0 && next > stockFor(productId)) {
            toast.error(`Only ${stockFor(productId)} left in stock`);
            return c;
          }
          return { ...c, quantity: next };
        })
        .filter((c) => c.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.product._id !== productId));
  };

  const subtotal = cart.reduce(
    (sum, c) => sum + c.product.price * c.quantity,
    0,
  );

  const rawDiscount =
    discountType === "percent"
      ? (subtotal * discountValue) / 100
      : discountValue;
  const discountAmount = Math.min(Math.max(rawDiscount || 0, 0), subtotal);

  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * (taxRate || 0)) / 100;
  const total = taxableAmount + taxAmount;

  const effectiveDiscountPercent =
    subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
  const discountOverCap =
    discountCapPercent !== undefined &&
    effectiveDiscountPercent > discountCapPercent + 0.01;

  const [pendingRequest, setPendingRequest] =
    useState<DiscountApprovalRequest | null>(null);
  const [exchangeCode, setExchangeCode] = useState("");

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const payload = {
      items: cart.map((c) => ({
        productId: c.product._id,
        quantity: c.quantity,
      })),
      paymentMethod,
      discountType,
      discountValue,
      taxRate,
    };

    if (discountOverCap) {
      setCheckingOut(true);
      try {
        const res = await createDiscountApprovalRequestApi(payload);
        if (res.success) {
          setPendingRequest(res.data);
          toast.success("Approval request sent");
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message ?? "Failed to send request");
      } finally {
        setCheckingOut(false);
      }
      return;
    }

    setCheckingOut(true);
    try {
      const res = await createSaleApi({
        ...payload,
        ...(exchangeCode.trim() ? { linkedReturnId: exchangeCode.trim() } : {}),
      });
      if (res.success) {
        toast.success(`Sale ${res.data.saleNumber} recorded`);
        setCart([]);
        setPaymentMethod("cash");
        setDiscountType("amount");
        setDiscountValue(0);
        setTaxRate(0);
        setExchangeCode("");
        fetchInventory();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!pendingRequest) return;
    try {
      await cancelApprovalRequestApi(pendingRequest._id);
      toast("Request cancelled");
    } catch {
      // best-effort
    } finally {
      setPendingRequest(null);
      fetchInventory();
    }
  };

  useEffect(() => {
    if (!pendingRequest || pendingRequest.status !== "pending") return;
    const interval = setInterval(async () => {
      try {
        const res = await getMyLatestApprovalRequestApi();
        if (res.success && res.data && res.data._id === pendingRequest._id) {
          setPendingRequest(res.data);
        }
      } catch {
        // transient poll failure
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pendingRequest]);

  useEffect(() => {
    if (!pendingRequest || pendingRequest.status === "pending") return;
    const t = setTimeout(() => {
      if (pendingRequest.status === "approved") {
        toast.success("Approved — sale recorded");
        setCart([]);
        setPaymentMethod("cash");
        setDiscountType("amount");
        setDiscountValue(0);
        setTaxRate(0);
      } else if (pendingRequest.status === "rejected") {
        toast.error(
          pendingRequest.reviewNote
            ? `Rejected: ${pendingRequest.reviewNote}`
            : "Request rejected",
        );
      } else if (pendingRequest.status === "expired") {
        toast.error("Request expired — please try again");
      }
      fetchInventory();
      setPendingRequest(null);
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRequest?.status]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
                <ShoppingCart size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">New Sale</h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  {userInfo?.branch || "Select a branch"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CreditCard size={16} className="text-slate-400" />
            <span>Cashier: {userInfo?.name || "Unknown"}</span>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Product picker */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="relative mb-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-200/50">
              <Search
                size={18}
                className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product name or SKU..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
              />
            </div>

            <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm border border-slate-200/50 overflow-y-auto">
              {loading ? (
                <LoadingSpinner label="Loading products..." />
              ) : availableStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-blue-50 p-4">
                    <PackageX className="h-12 w-12 text-blue-500" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-600">
                    No sellable products found
                  </h3>
                  <p className="mt-2 text-slate-400">
                    Products need branch stock before they can be sold here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {availableStock.map((stock) => {
                    const product = getProduct(stock);
                    if (!product) return null;
                    const inCart = cartQuantity(product._id);
                    const remaining = stock.quantity - inCart;
                    const isMaxed = remaining <= 0;
                    return (
                      <button
                        key={stock._id}
                        onClick={() => addToCart(stock)}
                        disabled={isMaxed}
                        className={`relative rounded-xl border p-3 text-left transition active:scale-95 ${
                          isMaxed
                            ? "cursor-not-allowed border-slate-100 bg-slate-100 opacity-60"
                            : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
                        }`}
                      >
                        {inCart > 0 && (
                          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-md z-10">
                            {inCart}
                          </span>
                        )}
                        <div className="mb-2 aspect-square w-full overflow-hidden rounded-lg bg-slate-100">
                          {product.image?.url ? (
                            <img
                              src={product.image.url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                              <PackageX size={28} />
                            </div>
                          )}
                        </div>
                        <p className="truncate text-sm font-semibold text-slate-700">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-400">{product.sku}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-bold text-blue-600">
                            {(product.price ?? 0).toLocaleString()} Ks
                          </span>
                          <span
                            className={`text-xs font-medium transition-colors ${
                              remaining <= 0
                                ? "text-red-500"
                                : remaining <= 3
                                  ? "text-orange-500"
                                  : "text-slate-400"
                            }`}
                          >
                            {remaining} left
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="flex w-full flex-col rounded-2xl bg-white p-5 shadow-sm border border-slate-200/50 lg:w-96 lg:shrink-0">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-blue-50 p-1.5">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Cart</h2>
              <span className="ml-auto rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                {cart.length} item{cart.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {cart.length === 0 ? (
                <div className="mt-8 flex flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-slate-100 p-3">
                    <ShoppingCart className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    Tap a product to add it to the cart
                  </p>
                </div>
              ) : (
                cart.map((line) => (
                  <div
                    key={line.product._id}
                    className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-700 line-clamp-1">
                        {line.product.name}
                      </p>
                      <button
                        onClick={() => removeFromCart(line.product._id)}
                        className="rounded-lg p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => changeQuantity(line.product._id, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:shadow-sm"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-slate-800">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => changeQuantity(line.product._id, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:shadow-sm"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-slate-800">
                        {(
                          (line.product.price ?? 0) * line.quantity
                        ).toLocaleString()}{" "}
                        Ks
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4 space-y-4">
              {/* Exchange Code */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Exchange Code{" "}
                  <span className="normal-case font-normal text-slate-400">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={exchangeCode}
                  onChange={(e) => setExchangeCode(e.target.value)}
                  placeholder="e.g. RET-BR1-172939..."
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:shadow-md ${
                    exchangeCode.trim()
                      ? "border-blue-400 bg-blue-50 focus:border-blue-500"
                      : "border-slate-200 bg-slate-50/50 focus:border-blue-500 focus:bg-white"
                  }`}
                />
                {exchangeCode.trim() && (
                  <p className="mt-1 text-xs text-blue-600">
                    🔄 This sale will be linked as an exchange for{" "}
                    <span className="font-mono font-semibold">
                      {exchangeCode.trim()}
                    </span>
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethod)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount & Tax */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Discount
                    {discountCapPercent !== undefined && (
                      <span className="ml-1 normal-case text-slate-400">
                        (max {discountCapPercent}%
                        {discountCapEventName
                          ? ` — ${discountCapEventName}`
                          : ""}
                        )
                      </span>
                    )}
                  </label>
                  <div
                    className={`flex overflow-hidden rounded-xl border ${
                      discountOverCap ? "border-red-400" : "border-slate-200"
                    }`}
                  >
                    <input
                      type="number"
                      min={0}
                      value={discountValue || ""}
                      onChange={(e) =>
                        setDiscountValue(Math.max(0, Number(e.target.value)))
                      }
                      placeholder="0"
                      className="w-full min-w-0 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition focus:bg-white"
                    />
                    <div className="flex shrink-0 border-l border-slate-200">
                      <button
                        type="button"
                        onClick={() => setDiscountType("amount")}
                        className={`px-3 text-sm font-semibold transition-colors ${
                          discountType === "amount"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        Ks
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType("percent")}
                        className={`px-3 text-sm font-semibold transition-colors ${
                          discountType === "percent"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  {discountOverCap ? (
                    <p className="mt-1 text-xs font-medium text-red-500">
                      ⚠ Exceeds your {discountCapPercent}% limit — request
                      approval needed
                    </p>
                  ) : discountValue > 0 ? (
                    <p className="mt-1 text-xs text-slate-400">
                      {discountType === "percent"
                        ? `${discountValue}% = ${discountAmount.toLocaleString()} Ks off`
                        : `${discountValue.toLocaleString()} Ks flat off`}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tax (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={taxRate || ""}
                    onChange={(e) =>
                      setTaxRate(
                        Math.min(100, Math.max(0, Number(e.target.value))),
                      )
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
                  />
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 rounded-2xl bg-slate-50/80 p-3 border border-slate-200/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium text-slate-700">
                    {subtotal.toLocaleString()} Ks
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Discount
                      {discountType === "percent" ? ` (${discountValue}%)` : ""}
                    </span>
                    <span className="font-medium text-red-500">
                      -{discountAmount.toLocaleString()} Ks
                    </span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Tax ({taxRate}%)</span>
                    <span className="font-medium text-slate-700">
                      +{taxAmount.toLocaleString()} Ks
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-sm font-medium text-slate-500">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-slate-900">
                    {total.toLocaleString()} Ks
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkingOut || !!pendingRequest}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  discountOverCap
                    ? "bg-linear-to-r from-amber-500 to-amber-600 shadow-amber-200 hover:shadow-amber-300"
                    : "bg-linear-to-r from-blue-600 to-blue-700 shadow-blue-200 hover:shadow-blue-300"
                }`}
              >
                {checkingOut ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : discountOverCap ? (
                  <>
                    <Clock size={18} />
                    Request Approval
                  </>
                ) : (
                  "Complete Sale"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approval Modal */}
      {pendingRequest && pendingRequest.status === "pending" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-8 w-8 animate-pulse text-amber-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              Waiting for{" "}
              {pendingRequest.requiredApproverLevel === "admin"
                ? "Admin"
                : "Manager"}{" "}
              Approval
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Your discount request has been sent. This screen will update
              automatically once it's reviewed — items are held for you in the
              meantime.
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Request #{pendingRequest._id.slice(-6).toUpperCase()} ·{" "}
              {pendingRequest.totalAmount.toLocaleString()} Ks
            </p>

            <button
              onClick={handleCancelRequest}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-md"
            >
              <X size={16} />
              Cancel Request
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
