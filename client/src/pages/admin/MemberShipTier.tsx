import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  X,
  Trash2,
  Pencil,
  Loader2,
  Award,
  ArrowUpDown,
  Crown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  getMembershipTiersApi,
  createMembershipTierApi,
  updateMembershipTierApi,
  deleteMembershipTierApi,
} from "../../services/membershiptierService";
import type { MembershipTier } from "../../types/membershiptier";

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
    <p className="mt-4 text-sm text-slate-500 font-medium">Loading tiers...</p>
  </div>
);

const emptyForm = {
  name: "",
  minPurchaseCount: 0,
  order: 1,
  couponDiscountType: "percent" as "amount" | "percent",
  couponDiscountValue: 10,
  couponValidDays: 30,
};

export const MembershipTiers: React.FC = () => {
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const res = await getMembershipTiersApi();
      if (res.success) setTiers(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load tiers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchTiers(), 0);
    return () => clearTimeout(t);
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const openCreate = () => {
    setForm({ ...emptyForm, order: tiers.length + 1 });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (tier: MembershipTier) => {
    setForm({
      name: tier.name,
      minPurchaseCount: tier.minPurchaseCount,
      order: tier.order,
      couponDiscountType: tier.couponDiscountType,
      couponDiscountValue: tier.couponDiscountValue,
      couponValidDays: tier.couponValidDays,
    });
    setEditingId(tier._id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Tier name is required");
      return;
    }
    setSaving(true);
    try {
      const res = editingId
        ? await updateMembershipTierApi(editingId, form)
        : await createMembershipTierApi(form);
      if (res.success) {
        toast.success(editingId ? "Tier updated" : "Tier created");
        resetForm();
        fetchTiers();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to save tier");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tier: MembershipTier) => {
    if (!confirm(`Delete the "${tier.name}" tier? This can't be undone.`)) {
      return;
    }
    setBusyId(tier._id);
    try {
      const res = await deleteMembershipTierApi(tier._id);
      if (res.success) {
        toast.success("Tier deleted");
        fetchTiers();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to delete tier");
    } finally {
      setBusyId(null);
    }
  };

  const sortedTiers = [...tiers].sort((a, b) => a.order - b.order);

  // Compute stats
  const totalTiers = tiers.length;
  const minPurchases =
    sortedTiers.length > 0 ? sortedTiers[0].minPurchaseCount : 0;
  const maxPurchases =
    sortedTiers.length > 0
      ? sortedTiers[sortedTiers.length - 1].minPurchaseCount
      : 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
                <Award size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Membership Tiers
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Configure the loyalty ladder and level-up coupons
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300 active:scale-95 w-full sm:w-auto"
          >
            <Plus size={20} />
            New Tier
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Tiers
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {totalTiers}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <Crown size={20} className="text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Lowest Entry
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {minPurchases}
                </p>
                <p className="text-xs text-slate-400">purchases required</p>
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
                  Highest Tier
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {sortedTiers.length > 0
                    ? sortedTiers[sortedTiers.length - 1].name
                    : "—"}
                </p>
                <p className="text-xs text-slate-400">
                  {maxPurchases} purchases required
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <TrendingUp size={20} className="text-amber-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Avg. Discount
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {totalTiers > 0
                    ? Math.round(
                        tiers.reduce(
                          (acc, t) => acc + t.couponDiscountValue,
                          0,
                        ) / totalTiers,
                      )
                    : 0}
                  {tiers.some((t) => t.couponDiscountType === "percent")
                    ? "%"
                    : " Ks"}
                </p>
              </div>
              <div className="rounded-xl bg-purple-50 p-3">
                <Award size={20} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-sm">
          {loading ? (
            <LoadingSpinner />
          ) : sortedTiers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Award className="h-16 w-16 text-slate-300" />
              <h3 className="mt-4 text-xl font-semibold text-slate-600">
                No membership tiers configured yet
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Customers default to "Bronze" until you add tiers here.
              </p>
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                <Plus size={16} />
                Add First Tier
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200/50 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">
                      <span className="flex items-center gap-1">
                        <ArrowUpDown size={12} /> Order
                      </span>
                    </th>
                    <th className="px-6 py-4">Tier</th>
                    <th className="px-6 py-4">Unlocks At</th>
                    <th className="px-6 py-4">Level-Up Coupon</th>
                    <th className="px-6 py-4">Valid For</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedTiers.map((tier) => (
                    <tr
                      key={tier._id}
                      className="group transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {tier.order}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {tier.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {tier.minPurchaseCount} purchase
                        {tier.minPurchaseCount !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {tier.couponDiscountType === "percent"
                          ? `${tier.couponDiscountValue}% off`
                          : `${tier.couponDiscountValue.toLocaleString()} Ks off`}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {tier.couponValidDays} days
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(tier)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-600 transition hover:bg-emerald-100"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(tier)}
                            disabled={busyId === tier._id}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            {busyId === tier._id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Delete
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
      </div>

      {/* Modal – matches style of other modals */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? "Edit Tier" : "New Tier"}
              </h2>
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
                  Tier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g., Gold"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Sort Order <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.order}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, order: Number(e.target.value) }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Unlocks At (purchases){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.minPurchaseCount}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        minPurchaseCount: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Level-Up Coupon Discount{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex overflow-hidden rounded-xl border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200">
                  <input
                    type="number"
                    min={0}
                    value={form.couponDiscountValue}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        couponDiscountValue: Number(e.target.value),
                      }))
                    }
                    className="w-full min-w-0 px-4 py-3 outline-none"
                  />
                  <div className="flex shrink-0 border-l border-slate-200">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, couponDiscountType: "amount" }))
                      }
                      className={`px-4 text-sm font-semibold transition-colors ${
                        form.couponDiscountType === "amount"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      Ks
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          couponDiscountType: "percent",
                        }))
                      }
                      className={`px-4 text-sm font-semibold transition-colors ${
                        form.couponDiscountType === "percent"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      %
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Coupon Valid For (days){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.couponValidDays}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      couponValidDays: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-700 py-3 font-medium text-white transition hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      Saving...
                    </span>
                  ) : editingId ? (
                    "Save Changes"
                  ) : (
                    "Create Tier"
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
