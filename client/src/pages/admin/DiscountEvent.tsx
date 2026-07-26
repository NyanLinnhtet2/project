import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  X,
  Trash2,
  Power,
  Percent,
  Calendar,
  Store,
  Loader2,
  Sparkles,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  createDiscountEventApi,
  getDiscountEventsApi,
  updateDiscountEventApi,
  deleteDiscountEventApi,
} from "../../services/discountEventService";
import { getBranchesForDropdownApi } from "../../services/branchService";
import type {
  DiscountEvent,
  DiscountEventScope,
} from "../../types/discountEvent";

interface BranchOption {
  _id: string;
  name: string;
}

const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = "Loading events...",
}) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200"></div>
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-4 text-sm text-slate-500 font-medium">{label}</p>
  </div>
);

const StatusBadge: React.FC<{ event: DiscountEvent }> = ({ event }) => {
  const getStatus = (): { label: string; className: string; icon: string } => {
    if (!event.isActive) {
      return { label: "Disabled", className: "bg-slate-100 text-slate-600", icon: "⛔" };
    }
    const now = new Date();
    if (new Date(event.endDate) < now) {
      return { label: "Ended", className: "bg-slate-100 text-slate-600", icon: "📅" };
    }
    if (new Date(event.startDate) > now) {
      return { label: "Scheduled", className: "bg-blue-100 text-blue-700", icon: "⏳" };
    }
    return { label: "Live", className: "bg-emerald-100 text-emerald-700", icon: "🔴" };
  };

  const status = getStatus();
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
      {status.icon} {status.label}
    </span>
  );
};

const emptyForm = {
  name: "",
  scope: "all" as DiscountEventScope,
  branchIds: [] as string[],
  cashierCap: 10,
  managerCap: 30,
  startDate: "",
  endDate: "",
};

export const DiscountEvents: React.FC = () => {
  const [events, setEvents] = useState<DiscountEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<DiscountEvent[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    live: 0,
    scheduled: 0,
    ended: 0,
    disabled: 0,
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await getDiscountEventsApi();
      if (res.success) {
        setEvents(res.data);
        computeStats(res.data);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await getBranchesForDropdownApi();
      if (res.success) setBranches(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to fetch branches");
    }
  };

  const computeStats = (data: DiscountEvent[]) => {
    const now = new Date();
    let live = 0,
      scheduled = 0,
      ended = 0,
      disabled = 0;
    data.forEach((ev) => {
      if (!ev.isActive) {
        disabled++;
        return;
      }
      const start = new Date(ev.startDate);
      const end = new Date(ev.endDate);
      if (end < now) ended++;
      else if (start > now) scheduled++;
      else live++;
    });
    setStats({
      total: data.length,
      live,
      scheduled,
      ended,
      disabled,
    });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchEvents();
      fetchBranches();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtering
  useEffect(() => {
    let filtered = [...events];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((ev) =>
        ev.name.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== "All") {
      const now = new Date();
      filtered = filtered.filter((ev) => {
        if (statusFilter === "Live") {
          return ev.isActive && new Date(ev.startDate) <= now && new Date(ev.endDate) >= now;
        }
        if (statusFilter === "Scheduled") {
          return ev.isActive && new Date(ev.startDate) > now;
        }
        if (statusFilter === "Ended") {
          return ev.isActive && new Date(ev.endDate) < now;
        }
        if (statusFilter === "Disabled") {
          return !ev.isActive;
        }
        return true;
      });
    }
    const t = setTimeout(()=>  setFilteredEvents(filtered), 0);
    return () => clearTimeout(t);
  }, [searchTerm, statusFilter, events]);

  const toggleBranchInForm = (branchId: string) => {
    setForm((f) => ({
      ...f,
      branchIds: f.branchIds.includes(branchId)
        ? f.branchIds.filter((id) => id !== branchId)
        : [...f.branchIds, branchId],
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (form.scope === "branch" && form.branchIds.length === 0) {
      toast.error("Pick at least one branch");
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast.error("Start and end dates are required");
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error("End date must be after start date");
      return;
    }

    setCreating(true);
    try {
      const res = await createDiscountEventApi({
        name: form.name.trim(),
        scope: form.scope,
        branchIds: form.scope === "branch" ? form.branchIds : undefined,
        cashierCap: form.cashierCap,
        managerCap: form.managerCap,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      if (res.success) {
        toast.success("Discount event created");
        resetForm();
        fetchEvents();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (event: DiscountEvent) => {
    setBusyId(event._id);
    try {
      const res = await updateDiscountEventApi(event._id, {
        isActive: !event.isActive,
      });
      if (res.success) {
        toast.success(event.isActive ? "Event disabled" : "Event enabled");
        fetchEvents();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to update event");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (event: DiscountEvent) => {
    if (!window.confirm(`Delete "${event.name}"? This can't be undone.`)) {
      return;
    }
    setBusyId(event._id);
    try {
      const res = await deleteDiscountEventApi(event._id);
      if (res.success) {
        toast.success("Event deleted");
        fetchEvents();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to delete event");
    } finally {
      setBusyId(null);
    }
  };

  // Helper to format branch names
  const getBranchNames = (event: DiscountEvent): string => {
    if (event.scope === "all") return "All Branches";
    if (event.branchNames?.length) return event.branchNames.join(", ");
    return `${event.branchIds.length} branch(es)`;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
                <Percent size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Discount Events
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Manage temporary discount cap adjustments for promotions
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
          >
            <Plus size={20} />
            New Event
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Events</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <Sparkles size={20} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Live</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.live}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Scheduled</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <Clock size={20} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Ended</p>
                <p className="mt-2 text-3xl font-bold text-slate-600">{stats.ended}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <Calendar size={20} className="text-slate-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Disabled</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">{stats.disabled}</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search events by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="All">All Status</option>
              <option value="Live">Live</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Ended">Ended</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
        </div>

        {/* Events Table */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/50">
          {loading ? (
            <LoadingSpinner />
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-blue-50 p-4">
                <Percent className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-600">
                No discount events found
              </h3>
              <p className="mt-2 text-slate-400">
                {searchTerm || statusFilter !== "All"
                  ? "Try adjusting your search or filters"
                  : "Create your first discount event to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/50">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Scope
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Cashier Cap
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Manager Cap
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Window
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
                    {filteredEvents.map((event) => (
                      <tr key={event._id} className="transition hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {event.name}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Store size={14} className="text-slate-400" />
                            <span title={getBranchNames(event)}>
                              {event.scope === "all" ? "All Branches" : getBranchNames(event)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {event.cashierCap}%
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {event.managerCap}%
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600">
                            <div>{new Date(event.startDate).toLocaleDateString()}</div>
                            <div className="text-xs text-slate-400">→ {new Date(event.endDate).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge event={event} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleToggleActive(event)}
                              disabled={busyId === event._id}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition hover:shadow-md disabled:opacity-50 ${
                                event.isActive
                                  ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              }`}
                            >
                              {busyId === event._id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Power size={14} />
                              )}
                              {event.isActive ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => handleDelete(event)}
                              disabled={busyId === event._id}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100 hover:shadow-md disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal - styled like employee modals */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">New Discount Event</h2>
              <button
                onClick={resetForm}
                className="rounded-lg p-2 transition hover:bg-slate-100"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Thingyan Sale 2026"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Scope <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, scope: "all", branchIds: [] }))}
                    className={`rounded-xl border px-4 py-3 font-medium transition ${
                      form.scope === "all"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    All Branches
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, scope: "branch" }))}
                    className={`rounded-xl border px-4 py-3 font-medium transition ${
                      form.scope === "branch"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Specific Branches
                  </button>
                </div>
              </div>

              {form.scope === "branch" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Select Branches <span className="text-red-500">*</span>
                  </label>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 p-3 space-y-1">
                    {branches.length === 0 ? (
                      <p className="text-sm text-slate-400">No branches available</p>
                    ) : (
                      branches.map((b) => (
                        <label
                          key={b._id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={form.branchIds.includes(b._id)}
                            onChange={() => toggleBranchInForm(b._id)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Store size={16} className="text-slate-400" />
                          <span className="text-sm text-slate-700">{b.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Cashier Cap (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.cashierCap}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cashierCap: Number(e.target.value) }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Manager Cap (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.managerCap}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, managerCap: Number(e.target.value) }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 py-3 font-medium text-white transition hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Event"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};