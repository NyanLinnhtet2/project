import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import {
  getStockEditRequestsApi,
  approveStockEditRequestApi,
  rejectStockEditRequestApi,
} from "../../services/inventoryService";
import type { StockEditRequest } from "../../types/inventory";
import type { Product } from "../../types/product";
import type { Branch } from "../../types/branch";

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
// Reject Modal (asks admin for a short note before rejecting)
// ============================================================
interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  isLoading: boolean;
}

const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-slate-900">Reject Request</h3>
        <p className="mt-1 text-sm text-slate-500">
          Manager အတွက် အကြောင်းရင်း ရေးထားပေးရင် ပိုနားလည်ပါလိမ့်မယ် (optional)
        </p>
        <textarea
          className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-red-500 focus:shadow-md"
          rows={3}
          placeholder="ဥပမာ - Physical count double-check ပြန်လုပ်ပြီး resubmit လုပ်ပေးပါ"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-red-600 py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 size={18} className="mx-auto animate-spin" />
            ) : (
              "Reject"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Empty State
// ============================================================
const EmptyState: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div className="text-center py-12">
    <div className="flex justify-center">
      <div className="rounded-full bg-blue-50 p-4">
        <ClipboardList className="h-12 w-12 text-blue-500" />
      </div>
    </div>
    <h3 className="mt-4 text-xl font-semibold text-slate-600">{title}</h3>
    <p className="mt-2 text-slate-400">{description}</p>
  </div>
);

// ============================================================
// Main Component
// ============================================================
interface StockEditRequestsTabProps {
  reviewedBy: string; // logged-in admin's name
  onActionSuccess?: () => void; // e.g. so the parent can refresh inventory/transactions too
}

const StockEditRequestsTab: React.FC<StockEditRequestsTabProps> = ({
  reviewedBy,
  onActionSuccess,
}) => {
  const [requests, setRequests] = useState<StockEditRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("PENDING");
  const [loading, setLoading] = useState<boolean>(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  const fetchRequests = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await getStockEditRequestsApi(
        statusFilter === "ALL" ? undefined : { status: statusFilter },
      );
      if (res.success) setRequests(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchRequests(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleApprove = async (id: string): Promise<void> => {
    setActioningId(id);
    try {
      const res = await approveStockEditRequestApi(id, reviewedBy || "Admin");
      if (res.success) {
        toast.success("Request approved and stock updated");
        fetchRequests();
        onActionSuccess?.();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to approve request");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (note: string): Promise<void> => {
    if (!rejectTargetId) return;
    setActioningId(rejectTargetId);
    try {
      const res = await rejectStockEditRequestApi(
        rejectTargetId,
        reviewedBy || "Admin",
        note,
      );
      if (res.success) {
        toast.success("Request rejected");
        fetchRequests();
        onActionSuccess?.();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to reject request");
    } finally {
      setActioningId(null);
      setRejectTargetId(null);
    }
  };

  const getProductName = (r: StockEditRequest): string =>
    typeof r.productId === "object" && r.productId !== null
      ? (r.productId as Product).name
      : "Unknown Product";

  const getProductSku = (r: StockEditRequest): string =>
    typeof r.productId === "object" && r.productId !== null
      ? (r.productId as Product).sku
      : "N/A";

  const getBranchName = (r: StockEditRequest): string =>
    typeof r.branchId === "object" && r.branchId !== null
      ? (r.branchId as Branch).name
      : "Unknown Branch";

  return (
    <div>
      {/* Header + Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Stock Edit Requests
          </h2>
          <p className="text-sm text-slate-500">
            Manager တင်ထားသည့် Stock Quantity ပြောင်းလိုသော Request များကို
            Review လုပ်ပါ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ALL">All</option>
          </select>
          <button
            onClick={fetchRequests}
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
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <p className="mt-4 text-sm text-slate-500 font-medium">
              Loading requests...
            </p>
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No requests found"
            description="ဒီ status အတွက် stock edit request မရှိသေးပါ။"
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
                    Branch
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Change
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Reason
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Requested By
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
                {requests.map((r) => (
                  <tr key={r._id} className="transition hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {getProductName(r)}
                      </p>
                      <p className="text-xs text-slate-400">
                        SKU: {getProductSku(r)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {getBranchName(r)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500">
                          {r.currentQuantity}
                        </span>
                        <ArrowRight size={14} className="text-slate-400" />
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
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {r.requestedBy}
                    </td>
                    <td className="px-6 py-4">
                      <RequestStatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-4">
                      {r.status === "PENDING" ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleApprove(r._id)}
                            disabled={actioningId === r._id}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-200 hover:scale-105 active:scale-95 disabled:opacity-60"
                          >
                            {actioningId === r._id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle size={14} />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectTargetId(r._id)}
                            disabled={actioningId === r._id}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200 hover:scale-105 active:scale-95 disabled:opacity-60"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="block text-center text-sm text-slate-400 italic">
                          {r.reviewedBy ? `by ${r.reviewedBy}` : "—"}
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

      <RejectModal
        isOpen={!!rejectTargetId}
        onClose={() => setRejectTargetId(null)}
        onConfirm={handleReject}
        isLoading={actioningId === rejectTargetId}
      />
    </div>
  );
};

export default StockEditRequestsTab;
