import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Users,
  RefreshCw,
  ClipboardList,
  MessageSquare,
  Mail,
  Phone,
  Wallet,
  ShieldAlert,
} from "lucide-react";
import {
  getEmployeesByBranchApi,
  requestEmployeeStatusChangeApi,
  getEmployeeStatusChangeRequestsApi,
} from "../../services/employeeServices";
import type { Employee, EmployeeStatusRequest } from "../../types/employee";
import { useAuth } from "../../context/useAuth"; // ⚠️ သင့်ရဲ့ actual path နဲ့ ချိန်ညှိပါ

// ============================================================
// Status Badge (employee active/inactive/suspended)
// ============================================================
const EmployeeStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<
    string,
    { label: string; className: string; icon: string }
  > = {
    active: {
      label: "Active",
      className: "bg-emerald-100 text-emerald-700",
      icon: "🟢",
    },
    inactive: {
      label: "Inactive",
      className: "bg-slate-100 text-slate-700",
      icon: "⚪",
    },
    suspended: {
      label: "Suspended",
      className: "bg-red-100 text-red-700",
      icon: "🔴",
    },
  };
  const info = map[status] || map.inactive;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${info.className}`}
    >
      {info.icon} {info.label}
    </span>
  );
};

// ============================================================
// Request Status Badge (workflow lifecycle)
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
// Request Status Change Modal
// ============================================================
interface RequestStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  branchId: string;
  performedBy: string;
  onSuccess: () => void;
}

const RequestStatusModal: React.FC<RequestStatusModalProps> = ({
  isOpen,
  onClose,
  employee,
  performedBy,
  onSuccess,
}) => {
  const [requestedStatus, setRequestedStatus] = useState<
    "active" | "inactive" | "suspended"
  >("active");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && employee) {
      // default to the "next logical" status instead of the current one
      const t = setTimeout(() => {
        setRequestedStatus(
          employee.status === "active" ? "inactive" : "active",
        );
        setReason("");
      }, 0);

      return () => clearTimeout(t);
    }
  }, [isOpen, employee]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (): Promise<void> => {
    if (requestedStatus === employee.status) {
      toast.error("Requested status ဟာ လက်ရှိ status နဲ့ တူနေပါတယ်။");
      return;
    }
    if (!reason.trim()) {
      toast.error("အကြောင်းပြချက် ထည့်သွင်းပေးပါ။");
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestEmployeeStatusChangeApi({
        employeeId: employee._id,
        requestedStatus,
        reason: reason.trim(),
        requestedBy: performedBy || "Manager",
      });
      if (res.success) {
        toast.success("Request တင်ပြီးပါပြီ — Admin approve လုပ်ဖို့ စောင့်ပါ");
        onSuccess();
        onClose();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message ?? "Request တင်ရာတွင် အမှားဖြစ်ပွားပါသည်",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <ShieldAlert size={20} className="text-blue-600" />
            Request Status Change
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm text-slate-700">
            Employee:{" "}
            <span className="font-semibold text-slate-900">
              {employee.name}
            </span>
          </p>
          <p className="text-sm text-slate-700">
            Current Status: <EmployeeStatusBadge status={employee.status} />
          </p>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Requested Status <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:shadow-md"
            value={requestedStatus}
            onChange={(e) =>
              setRequestedStatus(e.target.value as typeof requestedStatus)
            }
          >
            <option value="active">🟢 Active</option>
            <option value="inactive">⚪ Inactive</option>
            <option value="suspended">🔴 Suspended</option>
          </select>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:shadow-md"
            rows={3}
            placeholder="ဥပမာ - ခွင့်ရက်ကြာမြင့်စွာ ပျက်ကွက်နေလို့ (Attendance issue, resignation, etc.)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-200 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 py-3 font-medium text-white transition hover:scale-105 active:scale-95 disabled:opacity-70"
          >
            {isLoading ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main Manager Employees Page
// ============================================================
export const ManagerEmployees: React.FC = () => {
  const { userInfo } = useAuth();

  const [activeTab, setActiveTab] = useState<"staff" | "my-requests">("staff");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myRequests, setMyRequests] = useState<EmployeeStatusRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  // branch is stored as a NAME (e.g. "Yangon") on userInfo, same as the
  // inventory pages — the branch-scoped employee endpoint takes a name
  // directly so no ObjectId resolution is needed here.
  const branchId = userInfo?.branch || "";

  const fetchEmployees = async (): Promise<void> => {
    if (!branchId) return;
    try {
      const res = await getEmployeesByBranchApi(branchId);
      if (res.success) setEmployees(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load employees");
    }
  };

  const fetchMyRequests = async (): Promise<void> => {
    if (!branchId) return;
    try {
      const res = await getEmployeeStatusChangeRequestsApi({
        branch: branchId,
      });
      if (res.success) {
        const mine = (res.data as EmployeeStatusRequest[]).filter(
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
      await Promise.all([fetchEmployees(), fetchMyRequests()]);
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

  const handleOpenModal = (employee: Employee): void => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  if (!branchId) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-6">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            icon={<Users className="h-12 w-12 text-blue-500" />}
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
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                My Branch Staff
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {branchId} — staff directory &amp; status change requests
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
          {(["staff", "my-requests"] as const).map((tab) => (
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
                {tab === "staff" && <Users size={18} />}
                {tab === "my-requests" && <ClipboardList size={18} />}
                <span>{tab === "staff" ? "Staff" : "My Requests"}</span>
                {tab === "staff" && (
                  <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {employees.length}
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
          {/* Staff Tab */}
          {activeTab === "staff" &&
            (loading ? (
              <LoadingSpinner label="Loading staff..." />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200/50">
                {employees.length === 0 ? (
                  <EmptyState
                    icon={<Users className="h-12 w-12 text-blue-500" />}
                    title="No staff yet"
                    description="This branch has no employees assigned yet."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Contact
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Position
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Salary
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
                        {employees.map((emp) => (
                          <tr
                            key={emp._id}
                            className="transition hover:bg-slate-50/50"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {emp.image?.url ? (
                                  <img
                                    src={emp.image.url}
                                    alt={emp.name}
                                    className="h-9 w-9 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                                    {emp.name?.charAt(0)?.toUpperCase() || "?"}
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {emp.name}
                                  </p>
                                  <p className="text-xs text-slate-400 capitalize">
                                    {emp.role}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="flex items-center gap-1 text-sm text-slate-600">
                                <Mail size={12} className="text-slate-400" />{" "}
                                {emp.email}
                              </p>
                              <p className="flex items-center gap-1 text-xs text-slate-400">
                                <Phone size={12} className="text-slate-400" />{" "}
                                {emp.phone}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-700">
                              {emp.position}
                            </td>
                            <td className="px-6 py-4">
                              <p className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                                <Wallet size={14} className="text-slate-400" />
                                {emp.salary?.toLocaleString() ?? 0} MMK
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <EmployeeStatusBadge status={emp.status} />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center">
                                <button
                                  onClick={() => handleOpenModal(emp)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 transition hover:scale-105 hover:bg-blue-200 active:scale-95"
                                  title="Request Status Change"
                                >
                                  <ShieldAlert size={16} />
                                  Request Status Change
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
                    description="Staff status ကို ပြင်ချင်ရင် Staff tab ထဲက 'Request Status Change' ကို နှိပ်ပါ။"
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
                                {r.employeeName}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm">
                                <EmployeeStatusBadge status={r.currentStatus} />
                                <span className="text-slate-400">→</span>
                                <EmployeeStatusBadge
                                  status={r.requestedStatus}
                                />
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

      <RequestStatusModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        branchId={branchId}
        performedBy={userInfo?.name || "Manager"}
        onSuccess={refreshAll}
      />
    </div>
  );
};

export default ManagerEmployees;
