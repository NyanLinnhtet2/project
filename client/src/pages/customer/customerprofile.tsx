import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  Cake,
  Store,
  Award,
  TrendingUp,
  ShoppingBag,
  Ticket,
  Heart,
  Pencil,
  X,
} from "lucide-react";
import {
  getCustomerProfileApi,
  updateCustomerApi,
  sendBirthdayEmailApi,
} from "../../services/customerService";
import type { CustomerProfileData } from "../../types/customer";
import { useAuth } from "../../context/useAuth";

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-24">
    <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
    <p className="mt-4 text-sm text-slate-500 font-medium">
      Loading profile...
    </p>
  </div>
);

const COUPON_STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  used: "bg-slate-100 text-slate-500",
  expired: "bg-red-100 text-red-600",
};

const isBirthdayToday = (dateOfBirth?: string): boolean => {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  return dob.getMonth() === now.getMonth() && dob.getDate() === now.getDate();
};

export const CustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userInfo } = useAuth();
  const basePath = userInfo?.role === "admin" ? "/admin" : "/manager";

  const [data, setData] = useState<CustomerProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    dateOfBirth: "",
  });
  const [saving, setSaving] = useState(false);
  const [sendingBirthday, setSendingBirthday] = useState(false);

  const fetchProfile = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getCustomerProfileApi(id);
      if (res.success) setData(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchProfile, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openEdit = () => {
    if (!data) return;
    setEditForm({
      name: data.customer.name,
      phone: data.customer.phone,
      email: data.customer.email ?? "",
      dateOfBirth: data.customer.dateOfBirth
        ? data.customer.dateOfBirth.slice(0, 10)
        : "",
    });
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!id || !editForm.name.trim() || !editForm.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setSaving(true);
    try {
      const res = await updateCustomerApi(id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || undefined,
        dateOfBirth: editForm.dateOfBirth || undefined,
      });
      if (res.success) {
        toast.success("Customer updated");
        setShowEdit(false);
        fetchProfile();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  const handleSendBirthdayEmail = async () => {
    if (!id) return;
    setSendingBirthday(true);
    try {
      const res = await sendBirthdayEmailApi(id);
      if (res.success) {
        toast.success("Birthday email sent");
        fetchProfile();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to send birthday email");
    } finally {
      setSendingBirthday(false);
    }
  };

  if (loading || !data) {
    return <LoadingSpinner />;
  }

  const { customer, purchaseHistory, favoriteProducts, coupons, nextTier } =
    data;

  // All birthday coupons issued this calendar year (cron and/or a manual
  // send) — using every match rather than just the newest one, so a used
  // coupon still counts even if another (e.g. a duplicate from clicking
  // Send twice) happens to be newer and still active.
  const thisYearBirthdayCoupons = coupons.filter(
    (c) =>
      c.type === "birthday" &&
      new Date(c.createdAt).getFullYear() === new Date().getFullYear(),
  );
  const birthdayCouponUsed = thisYearBirthdayCoupons.some(
    (c) => c.status === "used",
  );
  const birthdayCouponAlreadySent = thisYearBirthdayCoupons.some(
    (c) => c.usedAt || c.emailSentAt,
  );
  const showBirthdayBanner =
    userInfo?.role === "admin" &&
    isBirthdayToday(customer.dateOfBirth) &&
    !birthdayCouponUsed;

  return (
    <div>
      <Link
        to={`${basePath}/customers`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} /> Back to Customers
      </Link>

      {showBirthdayBanner && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
            <Cake size={18} /> Today is {customer.name}'s birthday!
            {birthdayCouponAlreadySent
              ? " Their coupon has already been sent."
              : customer.email
                ? " Send them their birthday coupon by email."
                : " Add an email to send them a coupon."}
          </p>
          {!birthdayCouponAlreadySent && (
            <button
              onClick={handleSendBirthdayEmail}
              disabled={sendingBirthday || !customer.email}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingBirthday ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Mail size={16} />
              )}
              Send Birthday Email
            </button>
          )}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {customer.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Phone size={14} /> {customer.phone}
              </span>
              {customer.email && (
                <span className="flex items-center gap-1.5">
                  <Mail size={14} /> {customer.email}
                </span>
              )}
              {customer.dateOfBirth && (
                <span className="flex items-center gap-1.5">
                  <Cake size={14} />{" "}
                  {new Date(customer.dateOfBirth).toLocaleDateString()}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Store size={14} /> {customer.registeredBranch}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-indigo-100 px-4 py-2 text-sm font-bold text-indigo-700">
              <Award size={16} /> {customer.membershipLevel}
            </span>
            <button
              onClick={openEdit}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Pencil size={14} /> Edit
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Spent
            </p>
            <p className="mt-1 text-xl font-bold text-slate-800">
              {customer.totalSpent.toLocaleString()} Ks
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Purchases
            </p>
            <p className="mt-1 text-xl font-bold text-slate-800">
              {customer.purchaseCount}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 col-span-2 sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Next Tier
            </p>
            {nextTier ? (
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {nextTier.purchasesNeeded} more purchase
                {nextTier.purchasesNeeded !== 1 ? "s" : ""} to{" "}
                <span className="text-emerald-600">{nextTier.name}</span>
              </p>
            ) : (
              <p className="mt-1 text-sm font-semibold text-emerald-600">
                Top tier reached 🎉
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Purchase history */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
            <ShoppingBag size={18} className="text-emerald-600" />
            Purchase History
          </h2>
          {purchaseHistory.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No purchases yet
            </p>
          ) : (
            <div className="space-y-2">
              {purchaseHistory.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {s.saleNumber}
                    </p>
                    <p className="text-xs text-slate-400">
                      {s.branchName} ·{" "}
                      {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">
                      {s.totalAmount.toLocaleString()} Ks
                    </p>
                    {s.status === "voided" && (
                      <span className="text-xs font-medium text-red-500">
                        Voided
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Coupons */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
              <Ticket size={18} className="text-emerald-600" />
              Coupons
            </h2>
            {coupons.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                No coupons issued
              </p>
            ) : (
              <div className="space-y-2">
                {coupons.map((c) => (
                  <div
                    key={c._id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        {c.code}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${COUPON_STATUS_STYLE[c.status]}`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {c.discountType === "percent"
                        ? `${c.discountValue}% off`
                        : `${c.discountValue.toLocaleString()} Ks off`}{" "}
                      · {c.type === "birthday" ? "🎂 Birthday" : "⬆️ Level-up"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Expires {new Date(c.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Favorite products */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
              <Heart size={18} className="text-emerald-600" />
              Favorite Products
            </h2>
            {favoriteProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                No product history yet
              </p>
            ) : (
              <div className="space-y-2">
                {favoriteProducts.slice(0, 6).map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <TrendingUp size={13} className="text-slate-400" />
                      {p.name}
                    </span>
                    <span className="font-medium text-slate-500">
                      x{p.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">
                Edit Customer
              </h2>
              <button
                onClick={() => setShowEdit(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email{" "}
                  <span className="normal-case text-slate-400">
                    (needed for birthday coupon emails)
                  </span>
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date of Birth{" "}
                  <span className="normal-case text-slate-400">
                    (needed for the birthday coupon)
                  </span>
                </label>
                <input
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      dateOfBirth: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={16} className="mx-auto animate-spin" />
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};