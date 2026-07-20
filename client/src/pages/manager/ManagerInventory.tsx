import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Package,
  Store,
  RefreshCw,
  PenSquare,
  ClipboardList,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import {
  getBranchInventoryApi,
  getStockEditRequestsApi,
} from "../../services/inventoryService";
import type { Stock, StockEditRequest } from "../../types/inventory";
import type { Product } from "../../types/product";
import { useAuth } from "../../context/useAuth"; // ⚠️ သင့်ရဲ့ actual path နဲ့ ချိန်ညှိပါ
import EditStockRequestModal from "./EditStockRequestModal";

// Extended Stock type with populated product (same pattern as Inventory.tsx)
interface StockWithProduct extends Stock {
  product?: Product;
}

// ============================================================
// Status Badge (stock quantity level)
// ============================================================
const StatusBadge: React.FC<{ quantity: number }> = ({ quantity }) => {
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
    }
    return {
      label: "In Stock",
      className: "bg-blue-100 text-blue-700",
      icon: "🟢",
    };
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
// Request Status Badge (edit request lifecycle)
// ============================================================
const RequestStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<
    string,
    { label: string; className: string; icon: string }
  > = {
    PENDING: {
      label: "Pending",
      className: "bg-amber-100 text-amber-700",
      icon: "⏳",
    },
    APPROVED: {
      label: "Approved",
      className: "bg-emerald-100 text-emerald-700",
      icon: "✅",
    },
    REJECTED: {
      label: "Rejected",
      className: "bg-red-100 text-red-700",
      icon: "❌",
    },
  };
  const info = map[status?.toUpperCase()] || map.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${info.className}`}
    >
      {info.icon} {info.label}
    </span>
  );
};

// ============================================================
// Loading Spinner
// ============================================================
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

// ============================================================
// Empty State
// ============================================================
const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="text-center py-12">
    <div className="flex justify-center">
      <div className="rounded-full bg-blue-50 p-4">{icon}</div>
    </div>
    <h3 className="mt-4 text-xl font-semibold text-slate-600">{title}</h3>
    <p className="mt-2 text-slate-400">{description}</p>
  </div>
);

// ============================================================
// Main Manager Inventory Page
// ============================================================
export const ManagerInventory: React.FC = () => {
  const { userInfo } = useAuth();

  const [activeTab, setActiveTab] = useState<"stock" | "my-requests">("stock");
  const [inventory, setInventory] = useState<Stock[]>([]);
  const [myRequests, setMyRequests] = useState<StockEditRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isEditRequestModalOpen, setIsEditRequestModalOpen] =
    useState<boolean>(false);
  const [selectedStockItem, setSelectedStockItem] = useState<Stock | null>(
    null,
  );

  // ✅ FIX: userInfo.branch stores the branch NAME (e.g. "Yangon"), not its
  // ObjectId. We no longer resolve it to a Branch document on the client
  // (that required an admin-only endpoint and caused the 403 "Forbidden"
  // errors). The backend now resolves name -> ObjectId itself, so we can
  // just pass the name straight through and display it directly.
  const branchId = userInfo?.branch || "";

  const fetchInventory = async (): Promise<void> => {
    if (!branchId) return;
    try {
      const res = await getBranchInventoryApi(branchId);
      if (res.success) setInventory(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load inventory");
    }
  };

  // My Requests: fetch all requests for this branch, then keep only
  // the ones this manager submitted (backend doesn't filter by
  // requestedBy yet, so it's filtered client-side by name)
  const fetchMyRequests = async (): Promise<void> => {
    if (!branchId) return;
    try {
      const res = await getStockEditRequestsApi({ branchId });
      if (res.success) {
        const mine = (res.data as StockEditRequest[]).filter(
          (r) => r.requestedBy === userInfo?.name,
        );
        setMyRequests(mine);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message ?? "Failed to load your requests",
      );
    }
  };

  const refreshAll = async (): Promise<void> => {
    setLoading(true);
    try {
      // ✅ FIX: fetchBranchInfo() removed — no more getBranchesApi() call
      await Promise.all([fetchInventory(), fetchMyRequests()]);
    } catch {
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) {
      const t = setTimeout(() => refreshAll(), 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const handleOpenEditRequestModal = (stockItem: Stock): void => {
    setSelectedStockItem(stockItem);
    setIsEditRequestModalOpen(true);
  };

  const handleEditRequestSuccess = (): void => {
    refreshAll();
  };

  const getProductName = (stock: Stock): string => {
    const item = stock as StockWithProduct;
    if (item.product) return item.product.name;
    if (typeof stock.productId === "object" && stock.productId !== null) {
      return (stock.productId as Product).name;
    }
    return "Unknown Product";
  };

  const getProductSku = (stock: Stock): string => {
    const item = stock as StockWithProduct;
    if (item.product) return item.product.sku;
    if (typeof stock.productId === "object" && stock.productId !== null) {
      return (stock.productId as Product).sku;
    }
    return "N/A";
  };

  const getRequestProductName = (r: StockEditRequest): string =>
    typeof r.productId === "object" && r.productId !== null
      ? (r.productId as Product).name
      : "Unknown Product";

  // No branch assigned yet — guard so the page doesn't silently show nothing
  if (!branchId) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-6">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            icon={<Store className="h-12 w-12 text-blue-500" />}
            title="No branch assigned"
            description="Your account isn't linked to a branch yet. Please contact an admin."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
              <Store size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                My Branch Inventory
              </h1>
              {/* ✅ FIX: display the branch name directly from userInfo,
                  no separate Branch document fetch needed */}
              <p className="mt-0.5 text-sm text-slate-500">
                {branchId} — stock overview &amp; edit requests
              </p>
            </div>
          </div>

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

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-sm border border-slate-200/50">
          {(["stock", "my-requests"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-xl px-6 py-3 font-medium transition-all duration-300 ${
                activeTab === tab
                  ? "bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {tab === "stock" && <Package size={18} />}
                {tab === "my-requests" && <ClipboardList size={18} />}
                <span>{tab === "stock" ? "Stock" : "My Requests"}</span>
                {tab === "stock" && (
                  <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {inventory.length}
                  </span>
                )}
                {tab === "my-requests" && (
                  <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {myRequests.filter((r) => r.status === "PENDING").length}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/50">
          {/* Stock Tab */}
          {activeTab === "stock" &&
            (loading ? (
              <LoadingSpinner label="Loading inventory..." />
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
                              <p className="font-medium text-slate-900">
                                {getProductName(item)}
                              </p>
                              <p className="text-xs text-slate-400">
                                SKU: {getProductSku(item)}
                              </p>
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
                              <div className="flex justify-center">
                                <button
                                  onClick={() =>
                                    handleOpenEditRequestModal(item)
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 transition hover:scale-105 hover:bg-blue-200 active:scale-95"
                                  title="Request Stock Edit"
                                >
                                  <PenSquare size={16} />
                                  Request Edit
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
            ))}

          {/* My Requests Tab */}
          {activeTab === "my-requests" &&
            (loading ? (
              <LoadingSpinner label="Loading your requests..." />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200/50">
                {myRequests.length === 0 ? (
                  <EmptyState
                    icon={<ClipboardList className="h-12 w-12 text-blue-500" />}
                    title="No requests yet"
                    description="Stock ကို ပြင်ချင်ရင် Stock tab ထဲက 'Request Edit' ကို နှိပ်ပါ။"
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
                            Change
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Reason
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Submitted
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {myRequests.map((r) => (
                          <tr
                            key={r._id}
                            className="transition hover:bg-slate-50/50"
                          >
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-900">
                                {getRequestProductName(r)}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-500">
                                  {r.currentQuantity}
                                </span>
                                <ArrowRight
                                  size={14}
                                  className="text-slate-400"
                                />
                                <span className="font-semibold text-slate-900">
                                  {r.requestedQuantity}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    r.changeAmount > 0
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {r.changeAmount > 0 ? "+" : ""}
                                  {r.changeAmount}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 max-w-220px">
                              <p className="text-sm text-slate-600 line-clamp-2">
                                {r.reason}
                              </p>
                              {r.status !== "PENDING" && r.adminNote && (
                                <p className="mt-1 flex items-start gap-1 text-xs text-slate-400 italic">
                                  <MessageSquare
                                    size={12}
                                    className="mt-0.5 shrink-0"
                                  />
                                  {r.adminNote}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <RequestStatusBadge status={r.status} />
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-500">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-slate-400">
                                {new Date(r.createdAt).toLocaleTimeString()}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Request Stock Edit Modal */}
      <EditStockRequestModal
        isOpen={isEditRequestModalOpen}
        onClose={() => {
          setIsEditRequestModalOpen(false);
          setSelectedStockItem(null);
        }}
        branchId={branchId}
        stockItem={selectedStockItem}
        performedBy={userInfo?.name || "Manager"}
        onSuccess={handleEditRequestSuccess}
      />
    </div>
  );
};

export default ManagerInventory;