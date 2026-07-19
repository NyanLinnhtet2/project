import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  getBranchInventoryApi,
  allocateStockApi,
  getStockTransactionsApi,
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
import type { ErrorResponse } from "../../types/ErrorResponse";
import axios from "axios";
import {
  Package,
  Store,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  RefreshCw,
  X,
  History,
  Truck,
  ShoppingBag,
} from "lucide-react";

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

interface StatusBadgeProps {
  quantity: number;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ quantity }) => {
  const getStatus = (qty: number) => {
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
// ============================================================
interface TransactionTypeBadgeProps {
  type: string;
}

const TransactionTypeBadge: React.FC<TransactionTypeBadgeProps> = ({
  type,
}) => {
  const types: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    purchase: {
      label: "Purchase",
      className: "bg-blue-100 text-blue-700",
      icon: <ShoppingBag size={12} />,
    },
    sale: {
      label: "Sale",
      className: "bg-emerald-100 text-emerald-700",
      icon: <CheckCircle size={12} />,
    },
    adjustment: {
      label: "Adjustment",
      className: "bg-amber-100 text-amber-700",
      icon: <AlertCircle size={12} />,
    },
    return: {
      label: "Return",
      className: "bg-purple-100 text-purple-700",
      icon: <RefreshCw size={12} />,
    },
    transfer: {
      label: "Transfer",
      className: "bg-orange-100 text-orange-700",
      icon: <Truck size={12} />,
    },
    received: {
      label: "Received",
      className: "bg-cyan-100 text-cyan-700",
      icon: <Package size={12} />,
    },
  };

  const typeInfo = types[type] || types.adjustment;

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
interface TransferStatusBadgeProps {
  status: string;
}

const TransferStatusBadge: React.FC<TransferStatusBadgeProps> = ({
  status,
}) => {
  const getStatus = (s: string) => {
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
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

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
// Main Inventory Component
// ============================================================
export const Inventory = () => {
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
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [allocateData, setAllocateData] = useState({
    productId: "",
    quantity: 0,
  });

  const fetchAllInitialData = async () => {
    try {
      const [bRes, pRes, tRes] = await Promise.all([
        getBranchesApi(),
        getProductsApi(),
        getTransfersApi(),
      ]);
      if (bRes.success) {
        setBranches(bRes.data);
        if (bRes.data.length > 0) setSelectedBranch(bRes.data[0]._id);
      }
      if (pRes.success) setProducts(pRes.data);
      if (tRes.success) setTransfers(tRes.data);
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;

      toast.error(message ?? "Something went wrong");
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchAllInitialData(), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!selectedBranch) return;

    const fetchBranchData = async () => {
      setLoading(true);
      try {
        const [invRes, transRes] = await Promise.all([
          getBranchInventoryApi(selectedBranch),
          getStockTransactionsApi(selectedBranch),
        ]);

        if (invRes.success) {
          setInventory(invRes.data);
        }

        if (transRes.success) {
          console.log("Data from API successfully received:", transRes.data);
          setTransactions(transRes.data);
        }
      } catch (error: unknown) {
        console.error("Error fetching branch data:", error);
        const message = axios.isAxiosError<ErrorResponse>(error)
          ? error.response?.data?.message
          : "Failed to load branch data";
        toast.error(message as string);
      } finally {
        setLoading(false);
      }
    };

    fetchBranchData();
  }, [selectedBranch]);

  // Fetch Functions
  const fetchBranches = async () => {
    try {
      const res = await getBranchesApi();
      if (res.success) {
        setBranches(res.data);
        if (res.data.length > 0) setSelectedBranch(res.data[0]._id);
      }
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;

      toast.error(message ?? "Something went wrong");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await getProductsApi();
      if (res.success) setProducts(res.data);
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;

      toast.error(message ?? "Something went wrong");
    }
  };

  const fetchInventory = async (branchId: string) => {
    setLoading(true);
    try {
      const res = await getBranchInventoryApi(branchId);
      if (res.success) setInventory(res.data);
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;

      toast.error(message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransfers = async () => {
    try {
      const res = await getTransfersApi();
      if (res.success) setTransfers(res.data);
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;

      toast.error(message ?? "Something went wrong");
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchBranches();
      fetchProducts();
      fetchTransfers();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // --- Handlers ---
  const handleAllocateStock = async (e: React.FormEvent) => {
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
        setIsModalOpen(false);
        setAllocateData({ productId: "", quantity: 0 });
        fetchInventory(selectedBranch);
      }
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;

      toast.error(message ?? "Something went wrong");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveTransferApi(id, "Admin");
      toast.success("Transfer Approved");
      fetchTransfers();
      fetchInventory(selectedBranch);
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;

      toast.error(message ?? "Something went wrong");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectTransferApi(id, "Admin");
      toast.success("Transfer Rejected");
      fetchTransfers();
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;

      toast.error(message ?? "Something went wrong");
    }
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
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
            >
              <PlusCircle size={20} />
              Add Stock
            </button>
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
                <button
                  onClick={() => fetchInventory(selectedBranch)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-md"
                >
                  <RefreshCw size={16} className="text-slate-400" />
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
                                    {typeof item.productId === "object" &&
                                    item.productId !== null
                                      ? (item.productId as Product).name
                                      : products.find(
                                          (p) =>
                                            p._id === String(item.productId),
                                        )?.name || String(item.productId)}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    SKU:{" "}
                                    {typeof item.productId === "object" &&
                                    item.productId !== null
                                      ? (item.productId as Product).sku
                                      : "N/A"}
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
                <button
                  onClick={fetchTransfers}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-md"
                >
                  <RefreshCw size={16} className="text-slate-400" />
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
                <button
                  onClick={() => fetchInventory(selectedBranch)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-md"
                >
                  <RefreshCw size={16} className="text-slate-400" />
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-xl font-bold text-slate-900">Add Stock</h3>
              <button
                onClick={() => setIsModalOpen(false)}
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
                  onClick={() => setIsModalOpen(false)}
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
    </div>
  );
};
