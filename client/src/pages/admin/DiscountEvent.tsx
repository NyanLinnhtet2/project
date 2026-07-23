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
  label = "Loading...",
}) => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
    <p className="mt-4 text-sm text-slate-500 font-medium">{label}</p>
  </div>
);

const getStatus = (
  event: DiscountEvent,
): { label: string; className: string } => {
  if (!event.isActive) {
    return { label: "Disabled", className: "bg-slate-100 text-slate-500" };
  }
  const now = new Date();
  if (new Date(event.endDate) < now) {
    return { label: "Ended", className: "bg-slate-100 text-slate-500" };
  }
  if (new Date(event.startDate) > now) {
    return { label: "Scheduled", className: "bg-blue-100 text-blue-700" };
  }
  return { label: "Live", className: "bg-emerald-100 text-emerald-700" };
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
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await getDiscountEventsApi();
      if (res.success) setEvents(res.data);
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
      toast.error(err.response?.data?.message ?? "Failed to fetch Branch");
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchEvents();
      fetchBranches();
    }, 0);
    return () => clearTimeout(t);
  }, []);

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-800">
              Discount Events
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Temporarily raise the cashier/manager discount limit for a promotion
            — reverts automatically when it ends.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700"
        >
          <Plus size={16} />
          New Event
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {loading ? (
          <LoadingSpinner />
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-500">
              No discount events yet
            </p>
            <p className="text-sm text-slate-400">
              Normal caps (10% cashier / 30% manager) apply until you create
              one.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="py-3">Name</th>
                <th className="py-3">Scope</th>
                <th className="py-3">Cashier Cap</th>
                <th className="py-3">Manager Cap</th>
                <th className="py-3">Window</th>
                <th className="py-3">Status</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const status = getStatus(event);
                return (
                  <tr key={event._id} className="border-b border-slate-50">
                    <td className="py-3 font-medium text-slate-700">
                      {event.name}
                    </td>
                    <td className="py-3 text-slate-500">
                      {event.scope === "all" ? (
                        "All Branches"
                      ) : (
                        <span title={event.branchNames?.join(", ")}>
                          {event.branchNames?.length
                            ? event.branchNames.join(", ")
                            : `${event.branchIds.length} branch(es)`}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-700">{event.cashierCap}%</td>
                    <td className="py-3 text-slate-700">{event.managerCap}%</td>
                    <td className="py-3 text-slate-500">
                      {new Date(event.startDate).toLocaleDateString()} –{" "}
                      {new Date(event.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleActive(event)}
                          disabled={busyId === event._id}
                          title={event.isActive ? "Disable" : "Enable"}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${
                            event.isActive
                              ? "border-slate-200 text-slate-500 hover:bg-slate-50"
                              : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {busyId === event._id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Power size={12} />
                          )}
                          {event.isActive ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => handleDelete(event)}
                          disabled={busyId === event._id}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={resetForm}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <h2 className="text-lg font-bold text-slate-800">
                New Discount Event
              </h2>
              <button
                onClick={resetForm}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Thingyan Sale 2026"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Scope
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, scope: "all", branchIds: [] }))
                    }
                    className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                      form.scope === "all"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    All Branches
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, scope: "branch" }))}
                    className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                      form.scope === "branch"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    Specific Branches
                  </button>
                </div>
              </div>

              {form.scope === "branch" && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Branches
                  </label>
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
                    {branches.length === 0 ? (
                      <p className="px-2 py-1 text-sm text-slate-400">
                        No branches found
                      </p>
                    ) : (
                      branches.map((b) => (
                        <label
                          key={b._id}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={form.branchIds.includes(b._id)}
                            onChange={() => toggleBranchInForm(b._id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <Store size={14} className="text-slate-400" />
                          {b.name}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Percent size={12} /> Cashier Cap
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.cashierCap}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        cashierCap: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Percent size={12} /> Manager Cap
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.managerCap}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        managerCap: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Calendar size={12} /> Start
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startDate: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Calendar size={12} /> End
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endDate: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Create Event"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
