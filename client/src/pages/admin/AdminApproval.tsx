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
  Users,
  AlertCircle,
  Timer,
  CheckCircle,
  Store,
} from "lucide-react";
import {
  getPendingApprovalsApi,
  approveApprovalRequestApi,
  rejectApprovalRequestApi,
} from "../../services/discountApprovalService";
import type { DiscountApprovalRequest } from "../../types/discountApprovalRequest";

// ============================================================
// Loading Spinner
// ============================================================
const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = "Loading approvals...",
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
// Time Left Display
// ============================================================
const timeLeft = (expiresAt: string): { text: string; isExpiring: boolean } => {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return { text: "Expired", isExpiring: true };
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (mins < 2) return { text: `${mins}m ${secs}s left`, isExpiring: true };
  return { text: `${mins}m ${secs}s left`, isExpiring: false };
};

// ============================================================
// Request Card Component
// ============================================================
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

  const { text: timeLeftText, isExpiring } = timeLeft(request.expiresAt);

  return (
    <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200/50 transition hover:shadow-md">
      {/* Header: Cashier & Branch */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full bg-blue-50 p-1.5">
              <User size={14} className="text-blue-600" />
            </div>
            <span className="font-semibold text-slate-800">
              {request.cashierName}
            </span>
            {showBranch && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                <Store size={12} />
                {request.branchName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Clock
              size={14}
              className={isExpiring ? "text-red-500" : "text-amber-500"}
            />
            <span
              className={
                isExpiring ? "text-red-600 font-medium" : "text-amber-600"
              }
            >
              {timeLeftText}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">
            {request.totalAmount.toLocaleString()} Ks
          </p>
          <p className="text-xs text-red-500">
            -{request.discountAmount.toLocaleString()} Ks ({effectivePercent}%)
          </p>
        </div>
      </div>

      {/* Items summary */}
      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
        <ShoppingBag size={14} className="text-slate-400" />
        <span>
          {request.items.length} item{request.items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Items list */}
      <div className="mt-2 max-h-32 overflow-y-auto rounded-xl bg-slate-50/80 p-3 space-y-1.5">
        {request.items.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-wrap items-center justify-between text-xs text-slate-700 gap-1"
          >
            <span className="truncate pr-2">
              {item.name} × {item.quantity}
              <span className="ml-1.5 text-slate-400">
                | {item.category} | {item.brand}
              </span>
            </span>
            <span className="font-medium whitespace-nowrap">
              {(item.price * item.quantity).toLocaleString()} Ks
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => onReject(request._id)}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:shadow-md disabled:opacity-50"
        >
          <X size={16} />
          Reject
        </button>
        <button
          onClick={() => onApprove(request._id)}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:scale-105 hover:shadow-xl hover:shadow-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Check size={16} />
          )}
          Approve
        </button>
      </div>
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
export const AdminApprovals: React.FC = () => {
  const [requests, setRequests] = useState<DiscountApprovalRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<
    DiscountApprovalRequest[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    expiring: 0,
    pending: 0,
  });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getPendingApprovalsApi();
      if (res.success) {
        setRequests(res.data);
        computeStats(res.data);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (data: DiscountApprovalRequest[]) => {
    const now = Date.now();
    let expiring = 0;
    data.forEach((req) => {
      const ms = new Date(req.expiresAt).getTime() - now;
      if (ms <= 0 || ms < 120000) expiring++; // expired or <2min left
    });
    setStats({
      total: data.length,
      expiring,
      pending: data.length,
    });
  };

  useEffect(() => {
    const t = setTimeout(fetchRequests, 0);
    const interval = setInterval(fetchRequests, 8000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtering
  useEffect(() => {
    let filtered = [...requests];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.cashierName.toLowerCase().includes(term) ||
          req.branchName.toLowerCase().includes(term) ||
          req.items.some((item) => item.name.toLowerCase().includes(term)),
      );
    }
    if (statusFilter === "Expiring") {
      const now = Date.now();
      filtered = filtered.filter((req) => {
        const ms = new Date(req.expiresAt).getTime() - now;
        return ms <= 120000;
      });
    }

    const t = setTimeout(() => setFilteredRequests(filtered), 0);
    return () => clearTimeout(t);
  }, [searchTerm, statusFilter, requests]);

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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header - responsive */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
                <Clock size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Discount Approvals
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Review and manage discount requests from cashiers and managers
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:shadow-md disabled:opacity-60 w-full sm:w-auto"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Stats Cards - responsive grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending Requests
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.pending}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <Users size={20} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Expiring Soon
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {stats.expiring}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <Timer size={20} className="text-amber-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle size={12} />
              <span className="text-slate-400">
                Requests with &lt;2min left
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Unique Branches
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {new Set(requests.map((r) => r.branchId)).size}
                </p>
              </div>
              <div className="rounded-xl bg-indigo-50 p-3">
                <Store size={20} className="text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter - responsive stacking */}
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 w-full">
            <User
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by cashier, branch, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="All">All Requests</option>
              <option value="Expiring">Expiring Soon</option>
            </select>
          </div>
        </div>

        {/* Requests Grid */}
        {loading && filteredRequests.length === 0 ? (
          <LoadingSpinner />
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-16 shadow-sm border border-slate-200/50">
            <div className="rounded-full bg-blue-50 p-4">
              <CheckCircle className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-600">
              All caught up
            </h3>
            <p className="mt-2 text-slate-400">No pending discount requests</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredRequests.map((request) => (
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
    </div>
  );
};