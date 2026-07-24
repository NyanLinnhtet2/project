import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Loader2,
  Clock,
  Check,
  X,
  User,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import {
  getPendingApprovalsApi,
  approveApprovalRequestApi,
  rejectApprovalRequestApi,
} from "../../services/discountApprovalService";
import type { DiscountApprovalRequest } from "../../types/discountApprovalRequest";

const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = "Loading...",
}) => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
    <p className="mt-4 text-sm text-slate-500 font-medium">{label}</p>
  </div>
);

const timeLeft = (expiresAt: string): string => {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expiring...";
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s left`;
};

interface RequestCardProps {
  request: DiscountApprovalRequest;
  showBranch?: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  busy: boolean;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  showBranch,
  onApprove,
  onReject,
  busy,
}) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const effectivePercent =
    request.subtotal > 0
      ? ((request.discountAmount / request.subtotal) * 100).toFixed(1)
      : "0";

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <User size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-700">
              {request.cashierName}
            </span>
            {showBranch && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {request.branchName}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
            <Clock size={12} />
            {timeLeft(request.expiresAt)}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-800">
            {request.totalAmount.toLocaleString()} Ks
          </p>
          <p className="text-xs text-red-500">
            -{request.discountAmount.toLocaleString()} Ks ({effectivePercent}
            %)
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
        <ShoppingBag size={12} />
        {request.items.length} item{request.items.length !== 1 ? "s" : ""}
      </div>
      <div className="mt-2 space-y-1 rounded-xl bg-white p-2.5">
        {request.items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-xs text-slate-600"
          >
            <span className="truncate">
              {item.name} × {item.quantity} |
              <span className="ml-1">Category - {item.category}</span> |
              <span className="ml-1">Brand - {item.brand}</span>
            </span>
            <span className="font-medium">
              {(item.price * item.quantity).toLocaleString()} Ks
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onReject(request._id)}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <X size={14} />
          Reject
        </button>
        <button
          onClick={() => onApprove(request._id)}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 py-2 text-sm font-semibold text-white hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
          Approve
        </button>
      </div>
    </div>
  );
};

export const AdminApprovals: React.FC = () => {
  const [requests, setRequests] = useState<DiscountApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getPendingApprovalsApi();
      if (res.success) setRequests(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchRequests, 0);
    const interval = setInterval(fetchRequests, 8000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, []);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await approveApprovalRequestApi(id);
      if (res.success) {
        toast.success("Approved");
        fetchRequests();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to approve");
      fetchRequests();
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Reason for rejecting (optional):") || "";
    setBusyId(id);
    try {
      const res = await rejectApprovalRequestApi(id, reason);
      if (res.success) {
        toast.success("Rejected");
        fetchRequests();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to reject");
      fetchRequests();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Discount Approvals
          </h1>
          <p className="text-sm text-slate-500">
            Requests escalated beyond a manager's own limit, across all branches
          </p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading && requests.length === 0 ? (
        <LoadingSpinner />
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <Check className="h-10 w-10 text-emerald-300" />
          <p className="mt-3 font-medium text-slate-500">All caught up</p>
          <p className="text-sm text-slate-400">No pending requests</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {requests.map((request) => (
            <RequestCard
              key={request._id}
              request={request}
              showBranch
              onApprove={handleApprove}
              onReject={handleReject}
              busy={busyId === request._id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
