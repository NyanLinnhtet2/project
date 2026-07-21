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
} from "lucide-react";
import { getBranchInventoryApi } from "../../services/inventoryService";
import { createSaleApi } from "../../services/saleService";
import type { Stock } from "../../types/inventory";
import type { Product } from "../../types/product";
import type { CartLine, PaymentMethod } from "../../types/sale";
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
    <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
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
  const [checkingOut, setCheckingOut] = useState(false);

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

  useEffect(() => {
    const t = setTimeout(() => fetchInventory(), 0);
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

  const total = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setCheckingOut(true);
    try {
      const res = await createSaleApi({
        items: cart.map((c) => ({
          productId: c.product._id,
          quantity: c.quantity,
        })),
        paymentMethod,
      });
      if (res.success) {
        toast.success(`Sale ${res.data.saleNumber} recorded`);
        setCart([]);
        setPaymentMethod("cash");
        fetchInventory(); // stock just changed
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="flex h-full gap-6">
      {/* Product picker */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">New Sale</h1>
          <p className="text-sm text-slate-500">{userInfo?.branch}</p>
        </div>

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
                return (
                  <button
                    key={stock._id}
                    onClick={() => addToCart(stock)}
                    className="relative rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50 active:scale-95"
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
                      <span className="text-xs text-slate-400">
                        {stock.quantity} left
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

          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total</span>
            <span className="text-2xl font-bold text-slate-800">
              {total.toLocaleString()} Ks
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkingOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {checkingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Complete Sale"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
