import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Search,
  Loader2,
  Users,
  ChevronRight,
  ChevronLeft,
  UserCircle,
} from "lucide-react";
import {
  listCustomersApi,
  searchCustomersApi,
} from "../../services/customerService";
import type { Customer } from "../../types/customer";
import { useAuth } from "../../context/useAuth";

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
    <p className="mt-4 text-sm text-slate-500 font-medium">
      Loading customers...
    </p>
  </div>
);

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

export const Customers: React.FC = () => {
  const { userInfo } = useAuth();
  const basePath = userInfo?.role === "admin" ? "/admin" : "/manager";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCustomers = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await listCustomersApi(pageNum);
      if (res.success) {
        setCustomers(res.data);
        setTotalPages(res.totalPages);
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
  }, [page]);

  // Debounced search — falls back to the paginated list when cleared
  useEffect(() => {
    if (!search.trim()) return;

    const t = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await searchCustomersApi(search.trim());
        if (res.success) setCustomers(res.data);
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-100 p-2.5">
            <Users className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
            <p className="text-sm text-slate-500">
              Loyalty profiles, purchase history, and coupons
            </p>
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        {loading || searching ? (
          <LoadingSpinner />
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserCircle className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-500">
              No customers found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Purchases</th>
                  <th className="px-4 py-3">Total Spent</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      <span className="flex items-center gap-1.5">
                        {c.name}
                        {isBirthdayToday(c.dateOfBirth) &&
                          !c.birthdayCouponUsedThisYear && (
                            <span
                              title="Birthday today"
                              className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs"
                            >
                              🎂
                            </span>
                          )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{c.phone}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          TIER_COLORS[c.membershipLevel] ??
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.membershipLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {c.purchaseCount}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {c.totalSpent.toLocaleString()} Ks
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`${basePath}/customers/${c._id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        View <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!search.trim() && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
