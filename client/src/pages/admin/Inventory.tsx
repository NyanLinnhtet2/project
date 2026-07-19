import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  getBranchInventoryApi,
  allocateStockApi,
  getStockTransactionsApi,
  deductBranchStockApi,
} from "../../services/inventoryService";
import { getBranchesApi } from "../../services/branchService";
import { getProductsApi } from "../../services/productService";
import {
  getTransfersApi,
  approveTransferApi,
  rejectTransferApi,
} from "../../services/transferService";
import type { Stock, StockTransaction } from "../../types/inventory";
import type { Branch } from "../../types/branch";
import type { Product } from "../../types/product";
import type { TransferRecord } from "../../types/transfer";
import {
  Package,
  Store,
  AlertCircle,
  Loader2,
  PlusCircle,
  RefreshCw,
  X,
  History,
  Truck,
  MinusCircle,
} from "lucide-react";

// ============================================================
// Types
// ============================================================
interface StatusBadgeProps {
  quantity: number;
}

interface TransactionTypeBadgeProps {
  type: string;
}

interface TransferStatusBadgeProps {
  status: string;
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface DeductStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  stockItem: Stock | null;
  onSuccess: () => void;
}

// Extended Stock type with populated product
interface StockWithProduct extends Stock {
  product?: Product;
}

// ============================================================
// Loading Spinner Component
// ============================================================
const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200"></div>
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-4 text-sm text-slate-500 font-medium">
      Loading inventory data...
    </p>
  </div>
);

// ============================================================
// Status Badge Component
// ============================================================
const StatusBadge: React.FC<StatusBadgeProps> = ({ quantity }) => {
  const getStatus = (
    qty: number,
  ): { label: string; className: string; icon: string } => {
    if (qty === 0) {
      return {
        label: "Out of Stock",
        className: "bg-red-100 text-red-700",
        icon: "🔴",
      };
    } else if (qty < 10) {
      return {
        label: "Low Stock",
        className: "bg-amber-100 text-amber-700",
        icon: "🟡",
      };
    } else {
      return {
        label: "In Stock",
        className: "bg-blue-100 text-blue-700",
        icon: "🟢",
      };
    }
  };

  const status = getStatus(quantity);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
    >
      {status.icon} {status.label}
    </span>
  );
};

// ============================================================
// Transaction Type Badge Component
// ✅ FIXED: keys now match backend enum (INBOUND/OUTBOUND/ADJUSTMENT/DAMAGE)
//    and lookup is case-insensitive via toUpperCase()
// ============================================================
const TransactionTypeBadge: React.FC<TransactionTypeBadgeProps> = ({
  type,
}) => {
  const types: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    INBOUND: {
      label: "Inbound",
      className: "bg-cyan-100 text-cyan-700",
      icon: <Package size={12} />,
    },
    OUTBOUND: {
      label: "Outbound",
      className: "bg-red-100 text-red-700",
      icon: <MinusCircle size={12} />,
    },
    ADJUSTMENT: {
      label: "Adjustment",
      className: "bg-amber-100 text-amber-700",
      icon: <AlertCircle size={12} />,
    },
    DAMAGE: {
      label: "Damage",
      className: "bg-rose-100 text-rose-700",
      icon: <AlertCircle size={12} />,
    },
  };

  const typeInfo = types[type?.toUpperCase()] || types.ADJUSTMENT;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${typeInfo.className}`}
    >
      {typeInfo.icon}
      {typeInfo.label}
    </span>
  );
};

// ============================================================
// Transfer Status Badge Component
// ============================================================
const TransferStatusBadge: React.FC<TransferStatusBadgeProps> = ({
  status,
}) => {
  const getStatus = (
    s: string,
  ): { label: string; className: string; icon: string } => {
    switch (s) {
      case "pending":
        return {
          label: "Pending",
          className: "bg-amber-100 text-amber-700",
          icon: "⏳",
        };
      case "approved":
        return {
          label: "Approved",
          className: "bg-emerald-100 text-emerald-700",
          icon: "✅",
        };
      case "rejected":
        return {
          label: "Rejected",
          className: "bg-red-100 text-red-700",
          icon: "❌",
        };
      default:
        return {
          label: s,
          className: "bg-slate-100 text-slate-700",
          icon: "📦",
        };
    }
  };

  const statusInfo = getStatus(status);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${statusInfo.className}`}
    >
      {statusInfo.icon} {statusInfo.label}
    </span>
  );
};

// ============================================================
// Empty State Component
// ============================================================
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
}) => (
  <div className="text-center py-12">
    <div className="flex justify-center">
      <div className="rounded-full bg-blue-50 p-4">{icon}</div>
    </div>
    <h3 className="mt-4 text-xl font-semibold text-slate-600">{title}</h3>
    <p className="mt-2 text-slate-400">{description}</p>
  </div>
);

// ============================================================
// Deduct Stock Modal Component
// ============================================================
const DeductStockModal: React.FC<DeductStockModalProps> = ({
  isOpen,
  onClose,
  branchId,
  stockItem,
  onSuccess,
}) => {
  const [deductQty, setDeductQty] = useState<number>(1);
  const [reason, setReason] = useState<string>("");
  const [transactionType, setTransactionType] = useState<string>("OUTBOUND");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen || !stockItem) return null;

  const getProductName = (): string => {
    const item = stockItem as StockWithProduct;
    if (item.product) {
      return item.product.name;
    }
    if (
      typeof stockItem.productId === "object" &&
      stockItem.productId !== null
    ) {
      return (stockItem.productId as Product).name;
    }
    return "Unknown Product";
  };

  const getProductId = (): string => {
    const item = stockItem as StockWithProduct;
    if (item.product) {
      return item.product._id;
    }
    if (typeof stockItem.productId === "string") {
      return stockItem.productId;
    }
    if (
      typeof stockItem.productId === "object" &&
      stockItem.productId !== null
    ) {
      return (stockItem.productId as Product)._id;
    }
    return "";
  };

  const handleDeduct = async (): Promise<void> => {
    const productId = getProductId();

    if (!productId) {
      toast.error("Product ID not found");
      return;
    }

    if (deductQty <= 0) {
      toast.error("လျှော့မည့် အရေအတွက်သည် အနည်းဆုံး ၁ ခု ရှိရပါမည်။");
      return;
    }
    if (deductQty > stockItem.quantity) {
      toast.error(
        `လက်ကျန်အရေအတွက် (${stockItem.quantity}) ထက် ကျော်လွန်၍ ဖျက်၍မရပါ။`,
      );
      return;
    }
    if (!reason.trim()) {
      toast.error("အကြောင်းပြချက် ထည့်သွင်းပေးပါ။");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        branchId: branchId,
        productId: productId,
        quantity: deductQty,
        performedBy: "Admin",
        notes: reason,
        transactionType: transactionType as
          | "OUTBOUND"
          | "DAMAGE"
          | "ADJUSTMENT",
      };

      const response = await deductBranchStockApi(payload);

      if (response.success) {
        toast.success("Stock လျှော့ချခြင်း အောင်မြင်ပါသည်");
        onSuccess();
        onClose();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMsg = err.response?.data?.message || "Error deducting stock";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="text-xl font-bold text-slate-900">Deduct Stock</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-slate-100"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm text-slate-700">
            Product:{" "}
            <span className="font-semibold text-slate-900">
              {getProductName()}
            </span>
          </p>
          <p className="text-sm text-slate-700">
            Current Stock:{" "}
            <span className="font-semibold text-blue-600">
              {stockItem.quantity} units
            </span>
          </p>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Transaction Type <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:shadow-md"
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
          >
            <option value="OUTBOUND">
              📤 Outbound (အခြားသို့ ထုတ်ပေးခြင်း)
            </option>
            <option value="DAMAGE">💔 Damage (ပျက်စီး/ဆုံးရှုံးခြင်း)</option>
            <option value="ADJUSTMENT">
              📝 Adjustment (စာရင်းမှား၍ ပြန်လျှော့ခြင်း)
            </option>
          </select>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Quantity to Deduct <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            max={stockItem.quantity}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:shadow-md"
            value={deductQty}
            onChange={(e) => setDeductQty(Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-slate-400">
            Available: {stockItem.quantity} units
          </p>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Reason / Notes <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:shadow-md"
            rows={3}
            placeholder="Enter reason for deducting stock (e.g., Damaged items, Outbound transfer, etc.)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeduct}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-linear-to-r from-red-600 to-red-700 py-3 font-medium text-white transition hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </span>
            ) : (
              "Deduct Stock"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main Inventory Component
// ============================================================
export const Inventory: React.FC = () => {
  // Inventory States
  const [activeTab, setActiveTab] = useState<
    "stock" | "transfer" | "transactions"
  >("stock");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [inventory, setInventory] = useState<Stock[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isDeductModalOpen, setIsDeductModalOpen] = useState<boolean>(false);
  const [selectedStockItem, setSelectedStockItem] = useState<Stock | null>(
    null,
  );
  const [allocateData, setAllocateData] = useState({
    productId: "",
    quantity: 0,
  });

  // ============================================================
  // Fetch Functions (each one silent — no shared loading toggle
  // so they're safe to call together inside refreshAll)
  // ============================================================
  const fetchBranches = async (): Promise<void> => {
    try {
      const res = await getBranchesApi();
      if (res.success) {
        setBranches(res.data);
        if (res.data.length > 0 && !selectedBranch) {
          setSelectedBranch(res.data[0]._id);
        }
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Something went wrong");
    }
  };

  const fetchProducts = async (): Promise<void> => {
    try {
      const res = await getProductsApi();
      if (res.success) setProducts(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Something went wrong");
    }
  };

  const fetchInventory = async (branchId: string): Promise<void> => {
    if (!branchId) return;
    try {
      const res = await getBranchInventoryApi(branchId);
      if (res.success) setInventory(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Something went wrong");
    }
  };

  // ✅ NEW: transactions now has its own fetch function
  const fetchTransactions = async (branchId: string): Promise<void> => {
    if (!branchId) return;
    try {
      const res = await getStockTransactionsApi(branchId);
      if (res.success) setTransactions(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Something went wrong");
    }
  };

  const fetchTransfers = async (): Promise<void> => {
    try {
      const res = await getTransfersApi();
      if (res.success) setTransfers(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Something went wrong");
    }
  };

  // ✅ NEW: refreshAll — one single function every "Refresh" button
  // and every success handler calls, so all tabs always stay in sync
  const refreshAll = async (): Promise<void> => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBranches(),
        fetchProducts(),
        fetchTransfers(),
        fetchInventory(selectedBranch),
        fetchTransactions(selectedBranch),
      ]);
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  // Initial load (branches, products, transfers)
  useEffect(() => {
    const t = setTimeout(() => {
      fetchBranches();
      fetchProducts();
      fetchTransfers();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Whenever selected branch changes, load its inventory + transactions
  useEffect(() => {
    if (!selectedBranch) return;

    const fetchBranchData = async (): Promise<void> => {
      setLoading(true);
      try {
        await Promise.all([
          fetchInventory(selectedBranch),
          fetchTransactions(selectedBranch),
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBranchData();
  }, [selectedBranch]);

  // --- Handlers ---
  const handleAllocateStock = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (!allocateData.productId || allocateData.quantity <= 0) {
      toast.error("Please select a product and enter a valid quantity.");
      return;
    }

    try {
      const res = await allocateStockApi({
        branchId: selectedBranch,
        ...allocateData,
      });
      if (res.success) {
        toast.success("Stock allocated successfully!");
        setIsAddModalOpen(false);
        setAllocateData({ productId: "", quantity: 0 });
        refreshAll(); // ✅ keep everything in sync
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Something went wrong");
    }
  };

  const handleApprove = async (id: string): Promise<void> => {
    try {
      await approveTransferApi(id, "Admin");
      toast.success("Transfer Approved");
      refreshAll(); // ✅ keep everything in sync
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Something went wrong");
    }
  };

  const handleReject = async (id: string): Promise<void> => {
    try {
      await rejectTransferApi(id, "Admin");
      toast.success("Transfer Rejected");
      refreshAll(); // ✅ keep everything in sync
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Something went wrong");
    }
  };

  const handleOpenDeductModal = (stockItem: Stock): void => {
    setSelectedStockItem(stockItem);
    setIsDeductModalOpen(true);
  };

  const handleDeductSuccess = (): void => {
    refreshAll(); // ✅ keep everything in sync (was fetchInventory + fetchTransfers only)
  };

  const getProductName = (stock: Stock): string => {
    const item = stock as StockWithProduct;
    if (item.product) {
      return item.product.name;
    }
    if (typeof stock.productId === "object" && stock.productId !== null) {
      return (stock.productId as Product).name;
    }
    return "Unknown Product";
  };

  const getProductSku = (stock: Stock): string => {
    const item = stock as StockWithProduct;
    if (item.product) {
      return item.product.sku;
    }
    if (typeof stock.productId === "object" && stock.productId !== null) {
      return (stock.productId as Product).sku;
    }
    return "N/A";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Inventory Management
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Track and manage stock across all branches
                </p>
              </div>
            </div>
          </div>

          {activeTab === "stock" && (
            <div className="flex gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
              >
                <PlusCircle size={20} />
                Add Stock
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-sm border border-slate-200/50">
          {(["stock", "transfer", "transactions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-xl px-6 py-3 font-medium capitalize transition-all duration-300 ${
                activeTab === tab
                  ? "bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {tab === "stock" && <Package size={18} />}
                {tab === "transfer" && <Truck size={18} />}
                {tab === "transactions" && <History size={18} />}
                <span className="capitalize">{tab}</span>
                {tab === "stock" && (
                  <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {inventory.length}
                  </span>
                )}
                {tab === "transfer" && (
                  <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {transfers.filter((t) => t.status === "pending").length}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/50">
          {/* Stock Tab */}
          {activeTab === "stock" && (
            <div>
              {/* Branch Selector */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Store size={20} className="text-slate-400" />
                  <label className="font-medium text-slate-700">Branch:</label>
                  <select
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                  >
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* ✅ FIXED: was fetchInventory only, now refreshAll */}
                <button
                  onClick={refreshAll}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-md disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={`text-slate-400 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>

              {/* Inventory Table */}
              {loading ? (
                <LoadingSpinner />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200/50">
                  {inventory.length === 0 ? (
                    <EmptyState
                      icon={<Package className="h-12 w-12 text-blue-500" />}
                      title="No stock available"
                      description="This branch has no products in stock yet."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                              No.
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Product Name
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                              In Stock
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Status
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inventory.map((item, index) => (
                            <tr
                              key={item._id || index}
                              className="transition hover:bg-slate-50/50"
                            >
                              <td className="px-6 py-4 text-sm text-slate-500">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {getProductName(item)}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    SKU: {getProductSku(item)}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-2xl font-bold text-slate-900">
                                  {item.quantity}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <StatusBadge quantity={item.quantity} />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleOpenDeductModal(item)}
                                    className={`rounded-lg p-2 text-red-600 transition hover:scale-105 active:scale-95 ${
                                      item.quantity === 0
                                        ? "bg-red-50/50 cursor-not-allowed opacity-50"
                                        : "bg-red-100 hover:bg-red-200"
                                    }`}
                                    title="Deduct Stock"
                                    disabled={item.quantity === 0}
                                  >
                                    <MinusCircle size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Transfer Tab */}
          {activeTab === "transfer" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Transfer Requests
                  </h2>
                  <p className="text-sm text-slate-500">
                    Manage stock transfer requests between branches
                  </p>
                </div>
                {/* ✅ FIXED: was fetchTransfers only, now refreshAll */}
                <button
                  onClick={refreshAll}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-md disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={`text-slate-400 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200/50">
                {transfers.length === 0 ? (
                  <EmptyState
                    icon={<Truck className="h-12 w-12 text-blue-500" />}
                    title="No transfer requests"
                    description="There are no pending transfer requests."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Product
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            From ➔ To
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Qty
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Status
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transfers.map((t) => (
                          <tr
                            key={t._id}
                            className="transition hover:bg-slate-50/50"
                          >
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-slate-900">
                                  {typeof t.productId === "object" &&
                                  t.productId !== null
                                    ? (t.productId as Product).name
                                    : products.find(
                                        (p) => p._id === String(t.productId),
                                      )?.name || String(t.productId)}
                                </p>
                                <p className="text-xs text-slate-400">
                                  SKU:{" "}
                                  {typeof t.productId === "object" &&
                                  t.productId !== null
                                    ? (t.productId as Product).sku
                                    : "N/A"}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-red-500">
                                  {typeof t.fromBranchId === "object" &&
                                  t.fromBranchId !== null
                                    ? (t.fromBranchId as Branch).name
                                    : branches.find(
                                        (b) => b._id === String(t.fromBranchId),
                                      )?.name || String(t.fromBranchId)}
                                </span>
                                <span className="text-slate-300">➔</span>
                                <span className="font-medium text-blue-500">
                                  {typeof t.toBranchId === "object" &&
                                  t.toBranchId !== null
                                    ? (t.toBranchId as Branch).name
                                    : branches.find(
                                        (b) => b._id === String(t.toBranchId),
                                      )?.name || String(t.toBranchId)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-lg font-bold text-slate-900">
                                {t.quantity}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <TransferStatusBadge status={t.status} />
                            </td>
                            <td className="px-6 py-4">
                              {t.status === "pending" ? (
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleApprove(t._id)}
                                    className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-200 hover:scale-105 active:scale-95"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(t._id)}
                                    className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200 hover:scale-105 active:scale-95"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400 italic">
                                  Completed
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === "transactions" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Transaction History
                  </h2>
                  <p className="text-sm text-slate-500">
                    Complete history of all stock transactions
                  </p>
                </div>
                {/* ✅ FIXED: was fetchInventory (bug — never refreshed transactions),
                    now refreshAll refreshes transactions too */}
                <button
                  onClick={refreshAll}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-md disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={`text-slate-400 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200/50">
                {transactions.length === 0 ? (
                  <EmptyState
                    icon={<History className="h-12 w-12 text-blue-500" />}
                    title="No transactions found"
                    description="No stock transactions have been recorded yet."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Product
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Type
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Qty
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactions.map((t) => (
                          <tr
                            key={t._id}
                            className="transition hover:bg-slate-50/50"
                          >
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-900">
                                {(t.productId as Product)?.name || "N/A"}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <TransactionTypeBadge type={t.transactionType} />
                            </td>
                            <td className="px-6 py-4">
                              <p
                                className={`text-lg font-bold ${
                                  t.quantity > 0
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                              >
                                {t.quantity > 0 ? "+" : ""}
                                {t.quantity}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-500">
                                {new Date(t.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-slate-400">
                                {new Date(t.createdAt).toLocaleTimeString()}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Stock Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-xl font-bold text-slate-900">Add Stock</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-2 transition hover:bg-slate-100"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAllocateStock} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Select Product <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:shadow-md"
                  value={allocateData.productId}
                  onChange={(e) =>
                    setAllocateData({
                      ...allocateData,
                      productId: e.target.value,
                    })
                  }
                  required
                >
                  <option value="" disabled>
                    -- Choose a product --
                  </option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:shadow-md"
                  value={allocateData.quantity}
                  onChange={(e) =>
                    setAllocateData({
                      ...allocateData,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 py-3 font-medium text-white transition hover:scale-105 active:scale-95"
                >
                  Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deduct Stock Modal */}
      <DeductStockModal
        isOpen={isDeductModalOpen}
        onClose={() => {
          setIsDeductModalOpen(false);
          setSelectedStockItem(null);
        }}
        branchId={selectedBranch}
        stockItem={selectedStockItem}
        onSuccess={handleDeductSuccess}
      />
    </div>
  );
};