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
} from "lucide-react";
import {
  listCustomersApi,
  searchCustomersApi,
} from "../../services/customerService";
import type { Customer } from "../../types/customer";
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

const TIER_COLORS: Record<string, string> = {
  Bronze: "bg-amber-100 text-amber-700",
  Silver: "bg-slate-200 text-slate-700",
  Gold: "bg-yellow-100 text-yellow-700",
  Platinum: "bg-indigo-100 text-indigo-700",
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  Bronze: <Award size={14} className="text-amber-600" />,
  Silver: <Award size={14} className="text-slate-500" />,
  Gold: <Award size={14} className="text-yellow-600" />,
  Platinum: <Award size={14} className="text-indigo-600" />,
};

export const Customers: React.FC = () => {
  const { userInfo } = useAuth();
  const basePath = userInfo?.role === "admin" ? "/admin" : "/manager";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Compute stats from the current list (for display)
  const totalCustomers = customers.length;
  const tierCounts = customers.reduce(
    (acc, c) => {
      acc[c.membershipLevel] = (acc[c.membershipLevel] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(
      async () => {
        if (!search.trim()) {
          setLoading(true);

          try {
            const res = await listCustomersApi(page);

            if (!cancelled && res.success) {
              setCustomers(res.data);
              setTotalPages(res.totalPages);
            }
          } catch (error: unknown) {
            if (!cancelled) {
              const err = error as {
                response?: { data?: { message?: string } };
              };
              toast.error(
                err.response?.data?.message ?? "Failed to load customers",
              );
            }
          } finally {
            if (!cancelled) {
              setLoading(false);
            }
          }

          return;
        }

        setSearching(true);

        try {
          const res = await searchCustomersApi(search.trim());

          if (!cancelled && res.success) {
            setCustomers(res.data);
            // When searching, we don't get totalPages – we'll just show the results
            setTotalPages(1); // no pagination for search results
          }
        } catch {
          // ignore search errors
        } finally {
          if (!cancelled) {
            setSearching(false);
          }
        }
      },
      search.trim() ? 300 : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [page, search]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
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
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Customers
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {totalCustomers}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <Users size={20} className="text-emerald-600" />
              </div>
            </div>
          </div>

          {Object.entries(tierCounts).map(([tier, count]) => (
            <div
              key={tier}
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {tier} Tier
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {count}
                  </p>
                </div>
                <div
                  className={`rounded-xl p-3 ${TIER_COLORS[tier] || "bg-slate-100"}`}
                >
                  {TIER_ICONS[tier] || (
                    <Award size={20} className="text-slate-400" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or phone..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        {/* Table Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-sm">
          {loading || searching ? (
            <LoadingSpinner />
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <UserCircle className="h-16 w-16 text-slate-300" />
              <h3 className="mt-4 text-xl font-semibold text-slate-600">
                No customers found
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                {search.trim()
                  ? "Try adjusting your search terms"
                  : "Start by adding your first customer"}
              </p>
              {!search.trim() && (
                <Link
                  to={`${basePath}/customers/create`}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  <UserPlus size={16} />
                  Add Customer
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200/50 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Tier</th>
                    <th className="px-6 py-4">Purchases</th>
                    <th className="px-6 py-4">Total Spent</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr
                      key={c._id}
                      className="group transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {c.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{c.phone}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                            TIER_COLORS[c.membershipLevel] ??
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {TIER_ICONS[c.membershipLevel]}
                          {c.membershipLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {c.purchaseCount}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {c.totalSpent.toLocaleString()} Ks
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`${basePath}/customers/${c._id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 transition hover:text-emerald-700 group-hover:underline"
                        >
                          View <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!search.trim() && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="text-sm text-slate-500">
              Page <span className="font-semibold text-slate-700">{page}</span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">{totalPages}</span>
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
