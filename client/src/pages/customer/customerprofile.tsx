import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Phone,
  Mail,
  Cake,
  Store,
  Award,
  TrendingUp,
  ShoppingBag,
  Ticket,
  Heart,
  Calendar,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { getCustomerProfileApi } from "../../services/customerService";
import type { CustomerProfileData } from "../../types/customer";
import { useAuth } from "../../context/useAuth";

const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = "Loading sales data...",
}) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200"></div>
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-4 text-sm text-slate-500 font-medium">{label}</p>
  </div>
);

const COUPON_STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  used: "bg-slate-100 text-slate-500",
  expired: "bg-red-100 text-red-600",
};

const TIER_COLORS: Record<string, string> = {
  Bronze: "bg-amber-100 text-amber-700",
  Silver: "bg-slate-200 text-slate-700",
  Gold: "bg-yellow-100 text-yellow-700",
  Platinum: "bg-indigo-100 text-indigo-700",
};

export const CustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userInfo } = useAuth();
  const basePath = userInfo?.role === "admin" ? "/admin" : "/manager";

  const [data, setData] = useState<CustomerProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const t = setTimeout(async () => {
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
    }, 0);
    return () => clearTimeout(t);
  }, [id]);

  if (loading || !data) {
    return <LoadingSpinner />;
  }

  const { customer, purchaseHistory, favoriteProducts, coupons, nextTier } =
    data;

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Back button */}
        <Link
          to={`${basePath}/customers`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft size={16} /> Back to Customers
        </Link>

        {/* Profile Header Card */}
        <div className="rounded-2xl border border-slate-200/50 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {customer.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-400" />{" "}
                  {customer.phone}
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} className="text-slate-400" />{" "}
                    {customer.email}
                  </span>
                )}
                {customer.dateOfBirth && (
                  <span className="flex items-center gap-1.5">
                    <Cake size={14} className="text-slate-400" />{" "}
                    {formatDate(customer.dateOfBirth)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Store size={14} className="text-slate-400" />{" "}
                  {customer.registeredBranch}
                </span>
              </div>
            </div>

            <span
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${
                TIER_COLORS[customer.membershipLevel] ||
                "bg-slate-100 text-slate-700"
              }`}
            >
              <Award size={16} />
              {customer.membershipLevel}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Total Spent
                </p>
                <p className="mt-1 text-xl font-bold text-slate-800">
                  {customer.totalSpent.toLocaleString()} Ks
                </p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2">
                <DollarSign size={18} className="text-emerald-600" />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Purchases
                </p>
                <p className="mt-1 text-xl font-bold text-slate-800">
                  {customer.purchaseCount}
                </p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2">
                <ShoppingCart size={18} className="text-blue-600" />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Member Since
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {formatDate(customer.createdAt)}
                </p>
              </div>
              <div className="rounded-lg bg-indigo-100 p-2">
                <Calendar size={18} className="text-indigo-600" />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Next Tier
                </p>
                {nextTier ? (
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    <span className="text-emerald-600">{nextTier.name}</span>{" "}
                    <span className="font-normal text-slate-500">
                      ({nextTier.purchasesNeeded} more purchase
                      {nextTier.purchasesNeeded !== 1 ? "s" : ""})
                    </span>
                  </p>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-emerald-600">
                    🎉 Top tier reached
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-amber-100 p-2">
                <TrendingUp size={18} className="text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Two‑column layout: Purchase History (left) & Side panel (right) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Purchase History */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm">
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
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:bg-slate-100/70"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {s.saleNumber}
                      </p>
                      <p className="text-xs text-slate-400">
                        {s.branchName} · {formatDate(s.createdAt)}
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

          {/* Side panel */}
          <div className="space-y-6">
            {/* Coupons */}
            <div className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                <Ticket size={18} className="text-emerald-600" />
                Coupons
              </h2>
              {coupons.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  No coupons issued
                </p>
              ) : (
                <div className="space-y-3">
                  {coupons.map((c) => (
                    <div
                      key={c._id}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:bg-slate-100/70"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">
                          {c.code}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            COUPON_STATUS_STYLE[c.status] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {c.discountType === "percent"
                          ? `${c.discountValue}% off`
                          : `${c.discountValue.toLocaleString()} Ks off`}{" "}
                        ·{" "}
                        {c.type === "birthday" ? "🎂 Birthday" : "⬆️ Level-up"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Expires {formatDate(c.expiresAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Favorite Products */}
            <div className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                <Heart size={18} className="text-emerald-600" />
                Favorite Products
              </h2>
              {favoriteProducts.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  No product history yet
                </p>
              ) : (
                <div className="space-y-2.5">
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
      </div>
    </div>
  );
};
