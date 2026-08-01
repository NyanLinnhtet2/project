import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Printer,
  Loader2,
  PackageX,
  Clock,
  X,
  WifiOff,
  RefreshCw,
  User,
  UserX,
  Ticket,
  CheckCircle2,
} from "lucide-react";
import { getBranchInventoryApi } from "../../services/inventoryService";
import { createSaleApi } from "../../services/saleService";
import {
  searchCustomersApi,
  getActiveCouponsApi,
  createCustomerApi,
} from "../../services/customerService";
import { validateCouponApi } from "../../services/couponService";
import type { Customer, Coupon } from "../../types/customer";
import { getEffectiveDiscountCapApi } from "../../services/discountEventService";
import {
  createDiscountApprovalRequestApi,
  getMyLatestApprovalRequestApi,
  cancelApprovalRequestApi,
} from "../../services/discountApprovalService";
import {
  cacheProductsForBranch,
  getCachedProductsForBranch,
  queuePendingSale,
  getPendingSaleCount,
  syncPendingSales,
} from "../../services/offlinesyncService";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import type { CachedProduct } from "../../db/offlineDb";
import type { Stock } from "../../types/inventory";
import type { Product } from "../../types/product";
import type {
  CartLine,
  DiscountType,
  PaymentMethod,
  Sale,
} from "../../types/sale";
import { printReceipt } from "../../utils/printReceipt";
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

// So the product grid, cart math, etc. don't need to know or care whether
// a row came from the live API or the offline cache.
const cachedProductToStock = (cp: CachedProduct): Stock => ({
  _id: cp.productId,
  productId: cp.productId,
  quantity: cp.quantity,
  lowStockThreshold: 0,
  status: cp.quantity > 0 ? "In Stock" : "Out of Stock",
  lastUpdated: new Date().toISOString(),
  product: {
    _id: cp.productId,
    name: cp.name,
    sku: cp.sku,
    category: cp.category,
    brand: cp.brand,
    price: cp.price,
    image: cp.imageUrl ? { url: cp.imageUrl, public_id: "" } : undefined,
  },
});

const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = "Loading...",
}) => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
    <p className="mt-4 text-sm text-slate-500 font-medium">{label}</p>
  </div>
);

export const NewSale: React.FC = () => {
  const { userInfo } = useAuth();
  const branchId = userInfo?.branch || "";
  const isOnline = useOnlineStatus();

  const [stockList, setStockList] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
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
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPendingSyncCount = async () => {
    if (!branchId) return;
    try {
      setPendingSyncCount(await getPendingSaleCount(branchId));
    } catch {
      // IndexedDB not available (private browsing, etc.) — offline mode
      // just won't work on this device, online checkout is unaffected
    }
  };

  const fetchInventory = async () => {
    if (!branchId) return;
    setLoading(true);

    if (!isOnline) {
      try {
        const cached = await getCachedProductsForBranch(branchId);
        setStockList(cached.map(cachedProductToStock));
      } catch {
        toast.error("No offline product data saved yet for this branch");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await getBranchInventoryApi(branchId);
      if (res.success) {
        setStockList(res.data);
        cacheProductsForBranch(branchId, res.data).catch(() => {});
      }
    } catch (error: unknown) {
      // navigator.onLine can lie — if the request actually failed, fall
      // back to whatever we last cached instead of showing an empty grid
      try {
        const cached = await getCachedProductsForBranch(branchId);
        if (cached.length > 0) {
          setStockList(cached.map(cachedProductToStock));
          toast.error("Couldn't reach server — showing last saved products");
        } else {
          throw error;
        }
      } catch {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message ?? "Failed to load products");
      }
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
      // non-fatal — checkout still works, backend re-validates regardless;
      // the UI just won't show a cap hint until this succeeds
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchInventory();
      fetchDiscountCap();
      refreshPendingSyncCount();
    }, 0);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const handleSync = async () => {
    if (!branchId || syncing) return;
    setSyncing(true);
    try {
      const result = await syncPendingSales(branchId);
      if (result.synced > 0) {
        toast.success(
          `Synced ${result.synced} offline sale${result.synced !== 1 ? "s" : ""}`,
        );
      }
      if (result.failed > 0) {
        toast.error(
          `${result.failed} offline sale${result.failed !== 1 ? "s" : ""} couldn't sync — check with a manager`,
        );
      }
    } catch {
      toast.error("Sync failed — will retry automatically");
    } finally {
      setSyncing(false);
      refreshPendingSyncCount();
      fetchInventory();
    }
  };

  // Auto-sync the moment connectivity comes back
  const wasOnline = useRef(isOnline);
  useEffect(() => {
    if (!wasOnline.current && isOnline) {
      handleSync();
    }
    wasOnline.current = isOnline;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

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

  // Customer lookup — optional, links the sale to a customer for
  // purchase-history/membership tracking and unlocks coupon redemption
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  // Any active coupons this customer already has (birthday/level-up) —
  // surfaced proactively since many customers have no email on file to
  // have been notified with in the first place
  const [suggestedCoupons, setSuggestedCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    if (!customerSearch.trim() || selectedCustomer) {
      const t = setTimeout(() => {
        setCustomerResults([]);
      }, 0);
      return () => clearTimeout(t);
    }

    const t = setTimeout(async () => {
      try {
        setSearchingCustomer(true);
        const res = await searchCustomersApi(customerSearch.trim());
        if (res.success) setCustomerResults(res.data);
      } catch {
        // non-fatal — checkout still works without a customer attached
      } finally {
        setSearchingCustomer(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch, selectedCustomer]);

  const pickCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch("");
    setCustomerResults([]);
    setSuggestedCoupons([]);
    try {
      const res = await getActiveCouponsApi(customer._id);
      if (res.success) setSuggestedCoupons(res.data);
    } catch {
      // non-fatal — cashier can still type a coupon code manually
    }
  };

  // Register-on-the-spot when a search comes up empty — this is the only
  // place email/date-of-birth get captured, so it's worth surfacing here
  // rather than making the cashier send the customer to a separate page
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    dateOfBirth: "",
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const openAddCustomer = () => {
    const looksLikePhone = /^[\d+\-\s]+$/.test(customerSearch.trim());
    setNewCustomerForm({
      name: looksLikePhone ? "" : customerSearch.trim(),
      phone: looksLikePhone ? customerSearch.trim() : "",
      email: "",
      dateOfBirth: "",
    });
    setShowAddCustomer(true);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setCreatingCustomer(true);
    try {
      const res = await createCustomerApi({
        name: newCustomerForm.name.trim(),
        phone: newCustomerForm.phone.trim(),
        ...(newCustomerForm.email.trim()
          ? { email: newCustomerForm.email.trim() }
          : {}),
        ...(newCustomerForm.dateOfBirth
          ? { dateOfBirth: newCustomerForm.dateOfBirth }
          : {}),
      });
      if (res.success) {
        toast.success("Customer registered");
        setShowAddCustomer(false);
        await pickCustomer(res.data);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to register customer");
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Coupon — only redeemable once a customer is attached, since a coupon
  // is issued to a specific customer (see backend validateCoupon)
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setSuggestedCoupons([]);
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponError("");
  };

  const applyCouponCode = async (code: string) => {
    if (!selectedCustomer || !code.trim()) return;
    setCheckingCoupon(true);
    setCouponError("");
    try {
      const res = await validateCouponApi(code.trim(), selectedCustomer._id);
      if (res.success) {
        setAppliedCoupon(res.data);
        setCouponCode(code.trim());
        toast.success("Coupon applied");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message ?? "Invalid coupon";
      setCouponError(message);
      setAppliedCoupon(null);
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleApplyCoupon = () => applyCouponCode(couponCode);

  const clearCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponError("");
  };

  // Preview only — the backend recomputes and clamps this the same way at
  // checkout, so this is just so the cashier can see it before submitting
  const rawCouponDiscount = appliedCoupon
    ? appliedCoupon.discountType === "percent"
      ? (subtotal * appliedCoupon.discountValue) / 100
      : appliedCoupon.discountValue
    : 0;
  const couponDiscountAmount = Math.min(Math.max(rawCouponDiscount, 0), total);
  const finalTotal = total - couponDiscountAmount;

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

    if (!isOnline) {
      if (discountOverCap) {
        toast.error(
          "This discount needs manager/admin approval, which requires an internet connection",
        );
        return;
      }
      setCheckingOut(true);
      try {
        await queuePendingSale(branchId, payload);
        toast.success(
          "Saved offline — will sync automatically when back online",
        );
        setCart([]);
        setPaymentMethod("cash");
        setDiscountType("amount");
        setDiscountValue(0);
        setTaxRate(0);
        await refreshPendingSyncCount();
        await fetchInventory(); // re-render from the now-decremented cache
      } catch {
        toast.error("Couldn't save this sale offline on this device");
      } finally {
        setCheckingOut(false);
      }
      return;
    }

    if (discountOverCap) {
      setCheckingOut(true);
      try {
        const res = await createDiscountApprovalRequestApi({
          ...payload,
          ...(selectedCustomer ? { customerId: selectedCustomer._id } : {}),
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        });
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
        ...(selectedCustomer ? { customerId: selectedCustomer._id } : {}),
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
      });
      if (res.success) {
        toast.success(`Sale ${res.data.saleNumber} recorded`);
        setLastCompletedSale(res.data);
        setCart([]);
        setPaymentMethod("cash");
        setDiscountType("amount");
        setDiscountValue(0);
        setTaxRate(0);
        setExchangeCode("");
        clearCustomer();
        fetchInventory(); // stock just changed
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
      // best-effort — it may have already resolved server-side, which the
      // next poll tick or the current state will reflect either way
    } finally {
      setPendingRequest(null);
      fetchInventory();
    }
  };

  // Poll while a request is pending — no websockets needed for this volume
  useEffect(() => {
    if (!pendingRequest || pendingRequest.status !== "pending") return;
    const interval = setInterval(async () => {
      try {
        const res = await getMyLatestApprovalRequestApi();
        if (res.success && res.data && res.data._id === pendingRequest._id) {
          setPendingRequest(res.data);
        }
      } catch {
        // transient poll failure — try again next tick
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pendingRequest]);

  // React once the request leaves "pending"
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
        clearCustomer();
      } else if (pendingRequest.status === "rejected") {
        toast.error(
          pendingRequest.reviewNote
            ? `Rejected: ${pendingRequest.reviewNote}`
            : "Request rejected",
        );
      } else if (pendingRequest.status === "expired") {
        toast.error("Request expired — please try again");
      }
      fetchInventory(); // stock was reserved/released either way
      setPendingRequest(null);
    }, 0);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRequest?.status]);

  return (
    <div className="flex h-full gap-6">
      {/* Product picker */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">New Sale</h1>
            <p className="text-sm text-slate-500">{userInfo?.branch}</p>
          </div>

          <div className="flex items-center gap-2">
            {pendingSyncCount > 0 && (
              <button
                onClick={handleSync}
                disabled={syncing || !isOnline}
                className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={13}
                  className={syncing ? "animate-spin" : ""}
                />
                {pendingSyncCount} pending sync
              </button>
            )}
            {!isOnline && (
              <span className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                <WifiOff size={13} />
                Offline
              </span>
            )}
          </div>
        </div>

        {!isOnline && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
            You're offline — sales are saved on this device and will sync
            automatically once you're back online. Discounts above your normal
            limit and Exchange Code can't be used right now.
          </div>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name or SKU..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
          {loading ? (
            <LoadingSpinner label="Loading products..." />
          ) : availableStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <PackageX className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-slate-500 font-medium">
                No sellable products found
              </p>
              <p className="text-sm text-slate-400">
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
                        : "border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50"
                    }`}
                  >
                    {inCart > 0 && (
                      <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow z-10">
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
                      <span className="text-sm font-bold text-emerald-600">
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
      <div className="flex w-96 shrink-0 flex-col rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-800">Cart</h2>
          <span className="ml-auto rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            {cart.length} item{cart.length !== 1 ? "s" : ""}
          </span>
        </div>

        {lastCompletedSale && cart.length === 0 && (
          <button
            onClick={() => printReceipt(lastCompletedSale, userInfo?.branch)}
            className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            <Printer size={14} />
            Print Receipt ({lastCompletedSale.saleNumber})
          </button>
        )}

        <div className="flex-1 overflow-y-auto space-y-3">
          {cart.length === 0 ? (
            <p className="mt-8 text-center text-sm text-slate-400">
              Tap a product to add it to the cart
            </p>
          ) : (
            cart.map((line) => (
              <div
                key={line.product._id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700">
                    {line.product.name}
                  </p>
                  <button
                    onClick={() => removeFromCart(line.product._id)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changeQuantity(line.product._id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">
                      {line.quantity}
                    </span>
                    <button
                      onClick={() => changeQuantity(line.product._id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-slate-700">
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

        <div className="mt-4 border-t border-slate-100 pt-4">
          <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Customer{" "}
            <span className="normal-case text-slate-400">(optional)</span>
          </label>
          {selectedCustomer ? (
            <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <User size={16} className="shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-700">
                    {selectedCustomer.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedCustomer.phone} ·{" "}
                    {selectedCustomer.membershipLevel}
                  </p>
                </div>
              </div>
              <button
                onClick={clearCustomer}
                className="shrink-0 text-slate-400 hover:text-red-500"
              >
                <UserX size={16} />
              </button>
            </div>
          ) : (
            <div className="relative mb-4">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder={
                  isOnline
                    ? "Search by name or phone..."
                    : "Requires internet connection"
                }
                disabled={!isOnline}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              />
              {customerSearch.trim() && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {searchingCustomer ? (
                    <p className="px-3 py-2.5 text-sm text-slate-400">
                      Searching...
                    </p>
                  ) : (
                    <>
                      {customerResults.length === 0 ? (
                        <p className="px-3 py-2.5 text-sm text-slate-400">
                          No customer found
                        </p>
                      ) : (
                        customerResults.map((c) => (
                          <button
                            key={c._id}
                            onClick={() => pickCustomer(c)}
                            className="block w-full px-3 py-2.5 text-left text-sm hover:bg-emerald-50"
                          >
                            <span className="font-medium text-slate-700">
                              {c.name}
                            </span>
                            <span className="ml-1.5 text-xs text-slate-400">
                              {c.phone}
                            </span>
                          </button>
                        ))
                      )}
                      <button
                        onClick={openAddCustomer}
                        className="flex w-full items-center gap-1.5 border-t border-slate-100 px-3 py-2.5 text-left text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                      >
                        <User size={14} /> Add "{customerSearch.trim()}" as new
                        customer
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedCustomer && (
            <>
              {!appliedCoupon &&
                suggestedCoupons.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => applyCouponCode(c.code)}
                    disabled={!isOnline || checkingCoupon}
                    className="mb-3 flex w-full items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-left transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <span>{c.type === "birthday" ? "🎂" : "⬆️"}</span>
                      <span className="text-slate-700">
                        Has an unused{" "}
                        <span className="font-semibold">
                          {c.type === "birthday" ? "birthday" : "level-up"}
                        </span>{" "}
                        coupon —{" "}
                        {c.discountType === "percent"
                          ? `${c.discountValue}% off`
                          : `${c.discountValue.toLocaleString()} Ks off`}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
                      Apply
                    </span>
                  </button>
                ))}

              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Ticket size={12} /> Coupon Code{" "}
                <span className="normal-case text-slate-400">(optional)</span>
              </label>
              {appliedCoupon ? (
                <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span className="text-sm font-semibold text-slate-700">
                      {appliedCoupon.code}
                    </span>
                    <span className="text-xs text-emerald-600">
                      {appliedCoupon.discountType === "percent"
                        ? `${appliedCoupon.discountValue}% off`
                        : `${appliedCoupon.discountValue.toLocaleString()} Ks off`}
                    </span>
                  </div>
                  <button
                    onClick={clearCoupon}
                    className="shrink-0 text-slate-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="mb-1 flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponError("");
                    }}
                    placeholder="e.g. GOLD-8F3K2Q"
                    disabled={!isOnline}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={!isOnline || !couponCode.trim() || checkingCoupon}
                    className="shrink-0 rounded-xl bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checkingCoupon ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="mb-4 text-xs font-medium text-red-500">
                  {couponError}
                </p>
              )}
              {!appliedCoupon && !couponError && <div className="mb-4" />}
            </>
          )}

          <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Exchange Code{" "}
            <span className="normal-case text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={exchangeCode}
            onChange={(e) => setExchangeCode(e.target.value)}
            placeholder={
              isOnline
                ? "e.g. RET-BR1-172939..."
                : "Requires internet connection"
            }
            disabled={!isOnline}
            className={`mb-4 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
              exchangeCode.trim()
                ? "border-emerald-400 bg-emerald-50"
                : "border-slate-200"
            }`}
          />
          {exchangeCode.trim() && (
            <p className="-mt-3 mb-4 text-xs text-emerald-600">
              🔄 This sale will be linked as an exchange for{" "}
              {exchangeCode.trim()}
            </p>
          )}

          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Discount
                {discountCapPercent !== undefined && (
                  <span className="ml-1 normal-case text-slate-400">
                    (max {discountCapPercent}%
                    {discountCapEventName ? ` — ${discountCapEventName}` : ""})
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
                  className="w-full min-w-0 px-3 py-2.5 text-sm focus:outline-none"
                />
                <div className="flex shrink-0 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDiscountType("amount")}
                    className={`px-3 text-sm font-semibold transition-colors ${
                      discountType === "amount"
                        ? "bg-emerald-500 text-white"
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
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    %
                  </button>
                </div>
              </div>
              {discountOverCap ? (
                <p className="mt-1 text-xs font-medium text-red-500">
                  Exceeds your {discountCapPercent}% limit
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
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tax (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={taxRate || ""}
                onChange={(e) =>
                  setTaxRate(Math.min(100, Math.max(0, Number(e.target.value))))
                }
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="mb-4 space-y-1.5 rounded-xl bg-slate-50 p-3">
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
            {appliedCoupon && couponDiscountAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-slate-500">
                  <Ticket size={12} /> Coupon ({appliedCoupon.code})
                </span>
                <span className="font-medium text-red-500">
                  -{couponDiscountAmount.toLocaleString()} Ks
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
              <span className="text-sm font-medium text-slate-500">Total</span>
              <span className="text-2xl font-bold text-slate-800">
                {finalTotal.toLocaleString()} Ks
              </span>
            </div>
          </div>

          <button
            onClick={() => handleCheckout()}
            disabled={
              cart.length === 0 ||
              checkingOut ||
              !!pendingRequest ||
              (!isOnline && discountOverCap)
            }
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${
              discountOverCap
                ? "bg-linear-to-r from-amber-500 to-amber-600 shadow-amber-500/30 hover:from-amber-600 hover:to-amber-700"
                : "bg-linear-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700"
            }`}
          >
            {checkingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : discountOverCap ? (
              isOnline ? (
                "Request Approval"
              ) : (
                "Needs Internet Connection"
              )
            ) : !isOnline ? (
              "Complete Sale (Offline)"
            ) : (
              "Complete Sale"
            )}
          </button>
        </div>
      </div>

      {pendingRequest && pendingRequest.status === "pending" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-7 w-7 animate-pulse text-amber-600" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-800">
              Waiting for{" "}
              {pendingRequest.requiredApproverLevel === "admin"
                ? "Admin"
                : "Manager"}{" "}
              Approval
            </h2>
            <p className="mt-1 text-sm text-slate-500">
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
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
            >
              <X size={14} />
              Cancel Request
            </button>
          </div>
        </div>
      )}

      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">New Customer</h2>
              <button
                onClick={() => setShowAddCustomer(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomerForm.name}
                  onChange={(e) =>
                    setNewCustomerForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Customer name"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newCustomerForm.phone}
                  onChange={(e) =>
                    setNewCustomerForm((f) => ({
                      ...f,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="09xxxxxxxxx"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email{" "}
                  <span className="normal-case text-slate-400">
                    (optional — needed for birthday coupon emails)
                  </span>
                </label>
                <input
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) =>
                    setNewCustomerForm((f) => ({
                      ...f,
                      email: e.target.value,
                    }))
                  }
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date of Birth{" "}
                  <span className="normal-case text-slate-400">
                    (optional — needed for the birthday coupon)
                  </span>
                </label>
                <input
                  type="date"
                  value={newCustomerForm.dateOfBirth}
                  onChange={(e) =>
                    setNewCustomerForm((f) => ({
                      ...f,
                      dateOfBirth: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowAddCustomer(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomer}
                disabled={creatingCustomer}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingCustomer ? (
                  <Loader2 size={16} className="mx-auto animate-spin" />
                ) : (
                  "Register"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
