import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Search,
 
  Users,
  ChevronRight,
  ChevronLeft,
  UserCircle,
  UserPlus,
 
  Award,
  Gift,
  RefreshCw,
} from "lucide-react";
import {
  listCustomersApi,
  searchCustomersApi,
} from "../../services/customerService";
import type { Customer } from "../../types/customer";
import { useAuth } from "../../context/useAuth";

// ─── Loading Spinner ────────────────────────────────────────────
const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = "Loading customers...",
}) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200"></div>
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-4 text-sm text-slate-500 font-medium">{label}</p>
  </div>
);

// ─── Stat Card ──────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
}> = ({ label, value, icon, accent }) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md border border-slate-200/50">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`rounded-xl p-3 ${accent}`}>{icon}</div>
    </div>
  </div>
);

// ─── Tier Colors ────────────────────────────────────────────────
const TIER_COLORS: Record<string, string> = {
  Bronze: "bg-amber-100 text-amber-700",
  Silver: "bg-slate-200 text-slate-700",
  Gold: "bg-yellow-100 text-yellow-700",
  Platinum: "bg-indigo-100 text-indigo-700",
};

const isBirthdayToday = (dateOfBirth?: string): boolean => {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  return dob.getMonth() === now.getMonth() && dob.getDate() === now.getDate();
};

// ─── Main Component ─────────────────────────────────────────────
export const Customers: React.FC = () => {
  const { userInfo } = useAuth();
  const basePath = userInfo?.role === "admin" ? "/admin" : "/manager";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Stats ──
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    vip: 0,
    birthdaysToday: 0,
  });

  const computeStats = (data: Customer[]) => {
    const vip = data.filter(
      (c) => c.membershipLevel === "Gold" || c.membershipLevel === "Platinum",
    ).length;
    const birthdaysToday = data.filter(
      (c) => isBirthdayToday(c.dateOfBirth) && !c.birthdayCouponUsedThisYear,
    ).length;
    const active = data.every((c) => c.status === undefined)
      ? data.length
      : data.filter((c) => c.status === "active").length;

    setStats({
      total: data.length,
      active,
      vip,
      birthdaysToday,
    });
  };

  const fetchCustomers = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await listCustomersApi(pageNum);
      if (res.success) {
        setCustomers(res.data);
        setTotalPages(res.totalPages);
        computeStats(res.data);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchCustomers(page), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Debounced search — falls back to the paginated list when cleared
  useEffect(() => {
    if (!search.trim()) return;

    const t = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await searchCustomersApi(search.trim());
        if (res.success) {
          setCustomers(res.data);
          computeStats(res.data);
        }
      } catch {
        // non-fatal — list stays as-is
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!search.trim()) {
      const t = setTimeout(() => fetchCustomers(page), 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleRefresh = () => {
    if (search.trim()) {
      // Re-run search
      setSearching(true);
      searchCustomersApi(search.trim())
        .then((res) => {
          if (res.success) {
            setCustomers(res.data);
            computeStats(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setSearching(false));
    } else {
      fetchCustomers(page);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Customers
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Loyalty profiles, purchase history, and coupons
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-3.5 shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300 w-full sm:w-auto">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <UserPlus size={18} className="text-white/90" />
              <span className="text-xs font-medium text-white/90">
                Total Customers
              </span>
            </div>
            <p className="text-2xl font-bold text-white text-center sm:text-left">
              {stats.total}
            </p>
          </div>
        </div>

        {/* ─── Stats Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Customers"
            value={stats.total}
            icon={<Users size={20} className="text-white" />}
            accent="bg-blue-500"
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={<UserCircle size={20} className="text-white" />}
            accent="bg-emerald-500"
          />
          <StatCard
            label="VIP (Gold/Platinum)"
            value={stats.vip}
            icon={<Award size={20} className="text-white" />}
            accent="bg-amber-500"
          />
          <StatCard
            label="Birthdays Today"
            value={stats.birthdaysToday}
            icon={<Gift size={20} className="text-white" />}
            accent="bg-purple-500"
          />
        </div>

        {/* ─── Search & Refresh ───────────────────────────────────── */}
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-200/50 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 w-full">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading || searching}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-md disabled:opacity-60 w-full sm:w-auto"
          >
            <RefreshCw
              size={16}
              className={`text-slate-400 ${loading || searching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* ─── Customers Table ────────────────────────────────────── */}
        <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50">
          {loading || searching ? (
            <LoadingSpinner label={searching ? "Searching..." : "Loading customers..."} />
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-blue-50 p-4">
                <UserCircle className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-600">
                No customers found
              </h3>
              <p className="mt-2 text-slate-400">
                {search.trim()
                  ? "Try adjusting your search terms."
                  : "Customers will appear here once they sign up."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/50">
              <div className="overflow-x-auto">
                <table className="w-full min-w-700px">
                  <thead className="bg-slate-50 border-b border-slate-200/50">
                    <tr>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Name
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Phone
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Tier
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Purchases
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Total Spent
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((c) => (
                      <tr
                        key={c._id}
                        className="transition hover:bg-slate-50/50"
                      >
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-900 text-sm sm:text-base">
                              {c.name}
                            </span>
                            {isBirthdayToday(c.dateOfBirth) &&
                              !c.birthdayCouponUsedThisYear && (
                                <span
                                  title="Birthday today"
                                  className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs"
                                >
                                  🎂
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-slate-600">
                          {c.phone}
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              TIER_COLORS[c.membershipLevel] ??
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {c.membershipLevel}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-slate-600">
                          {c.purchaseCount}
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-semibold text-slate-900">
                          {c.totalSpent.toLocaleString()} Ks
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <Link
                            to={`${basePath}/customers/${c._id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                          >
                            View <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ─── Pagination ──────────────────────────────────────────── */}
        {!search.trim() && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};