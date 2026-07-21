import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  MessageSquare,
  Users,
} from "lucide-react";
import {
  getEmployeeStatusChangeRequestsApi,
  approveEmployeeStatusChangeRequestApi,
  rejectEmployeeStatusChangeRequestApi,
} from "../../services/employeeServices";
import type { EmployeeStatusRequest } from "../../types/employee";
import { useAuth } from "../../context/useAuth"; // ⚠️ သင့်ရဲ့ actual path နဲ့ ချိန်ညှိပါ

// ============================================================
// Status Badges
// ============================================================
const EmployeeStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; className: string; icon: string }> = {
    active: { label: "Active", className: "bg-emerald-100 text-emerald-700", icon: "🟢" },
    inactive: { label: "Inactive", className: "bg-slate-100 text-slate-700", icon: "⚪" },
    suspended: { label: "Suspended", className: "bg-red-100 text-red-700", icon: "🔴" },
  };
  const info = map[status] || map.inactive;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${info.className}`}>
      {info.icon} {info.label}
    </span>
  );
};

const RequestStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; className: string; icon: string }> = {
    PENDING: { label: "Pending", className: "bg-amber-100 text-amber-700", icon: "⏳" },
    APPROVED: { label: "Approved", className: "bg-emerald-100 text-emerald-700", icon: "✅" },
    REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700", icon: "❌" },
  };
  const info = map[status?.toUpperCase()] || map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${info.className}`}>
      {info.icon} {info.label}
    </span>
  );
};

// ============================================================
// Reject Modal
// ============================================================
interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  isLoading: boolean;
}

const RejectModal: React.FC<RejectModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
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
          placeholder="ဥပမာ - HR interview ပြီးမှ ဆုံးဖြတ်ပါမယ်"
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
            {isLoading ? <Loader2 size={18} className="mx-auto animate-spin" /> : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Empty State
// ============================================================
const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
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
// Main Page — Admin: Employee Status Change Requests
// ============================================================
export const EmployeeStatusRequests: React.FC = () => {
  const { userInfo } = useAuth();

  const [requests, setRequests] = useState<EmployeeStatusRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">(
    "PENDING",
  );
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  const fetchRequests = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await getEmployeeStatusChangeRequestsApi(
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
      const res = await approveEmployeeStatusChangeRequestApi(id, userInfo?.name || "Admin");
      if (res.success) {
        toast.success("Request approved and employee status updated");
        fetchRequests();
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
      const res = await rejectEmployeeStatusChangeRequestApi(
        rejectTargetId,
        userInfo?.name || "Admin",
        note,
      );
      if (res.success) {
        toast.success("Request rejected");
        fetchRequests();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to reject request");
    } finally {
      setActioningId(null);
      setRejectTargetId(null);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Staff Status Requests</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Manager တင်ထားသည့် Employee Status ပြောင်းလိုသော Request များကို Review လုပ်ပါ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
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
              <RefreshCw size={16} className={`text-slate-400 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/50">
          <div className="overflow-hidden rounded-2xl border border-slate-200/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="mt-4 text-sm text-slate-500 font-medium">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <EmptyState
                title="No requests found"
                description="ဒီ status အတွက် employee status request မရှိသေးပါ။"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Employee
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
                          <p className="font-medium text-slate-900">{r.employeeName}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{r.branch}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm">
                            <EmployeeStatusBadge status={r.currentStatus} />
                            <span className="text-slate-400">→</span>
                            <EmployeeStatusBadge status={r.requestedStatus} />
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-220px">
                          <p className="text-sm text-slate-600 line-clamp-2">{r.reason}</p>
                          {r.status !== "PENDING" && r.adminNote && (
                            <p className="mt-1 flex items-start gap-1 text-xs text-slate-400 italic">
                              <MessageSquare size={12} className="mt-0.5 shrink-0" />
                              {r.adminNote}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{r.requestedBy}</td>
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
        </div>
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

export default EmployeeStatusRequests;