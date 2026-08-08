import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BellRing,
  Loader2,
  RefreshCw,
  CheckCheck,
  Clock,
  Boxes,
  ShoppingCart,
  Users,
  ArrowRightLeft,
  AlertTriangle,
  Cake,
  Ban,
  X,
} from "lucide-react";
import { useNotifications } from "../context/useNotification";
import type { NotificationItem } from "../types/notification";
import { toast } from "react-hot-toast";

type Category = "all" | "approvals" | "inventory" | "sales" | "customers";

const CATEGORY_BY_TYPE: Record<string, Category> = {
  discount_approval: "approvals",
  stock_edit: "approvals",
  employee_status: "approvals",
  transfer_request: "approvals",
  low_stock: "inventory",
  stock_transfer_out: "inventory",
  voided_sale: "sales",
  birthday: "customers",
};

const TYPE_ICON: Record<string, React.ElementType> = {
  discount_approval: Clock,
  stock_edit: Boxes,
  employee_status: Users,
  transfer_request: ArrowRightLeft,
  low_stock: AlertTriangle,
  stock_transfer_out: ArrowRightLeft,
  voided_sale: Ban,
  birthday: Cake,
};

const SEVERITY_STYLE: Record<string, string> = {
  urgent: "border-l-red-500 bg-red-50/50",
  warning: "border-l-amber-500 bg-amber-50/50",
  info: "border-l-blue-500 bg-blue-50/50",
};

const SEVERITY_ICON_COLOR: Record<string, string> = {
  urgent: "text-red-600 bg-red-100",
  warning: "text-amber-600 bg-amber-100",
  info: "text-blue-600 bg-blue-100",
};

const CATEGORY_TABS: {
  key: Category;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "all", label: "All", icon: Bell },
  { key: "approvals", label: "Approvals", icon: Clock },
  { key: "inventory", label: "Inventory", icon: Boxes },
  { key: "sales", label: "Sales", icon: ShoppingCart },
  { key: "customers", label: "Customers", icon: Users },
];

const timeAgo = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
    <p className="mt-4 text-sm text-slate-500 font-medium">
      Loading notifications...
    </p>
  </div>
);

export const Notifications: React.FC = () => {
  const { items, unreadCount, loading, refresh, dismiss, remove, markAllRead } =
    useNotifications();
  const [category, setCategory] = useState<Category>("all");
  const [markingAll, setMarkingAll] = useState(false);
  const navigate = useNavigate();

  const handleItemClick = (item: NotificationItem) => {
    dismiss(item.id);
    if (item.link) navigate(item.link);
  };

  const handleDelete = (item: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    remove(item.id);
  };

  const handleMarkAllRead = async () => {
    if (markingAll) return; // prevent double-click
    setMarkingAll(true);
    try {
      await markAllRead();
      // Optional: toast feedback is inside the context function,
      // but we could add a local one if needed.
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message ?? "Failed to load return detail",
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const filtered =
    category === "all"
      ? items
      : items.filter((i) => CATEGORY_BY_TYPE[i.type] === category);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/30 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
              {unreadCount > 0 ? (
                <BellRing size={24} className="text-white" />
              ) : (
                <Bell size={24} className="text-white" />
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Notifications
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {items.length === 0
                  ? "You're all caught up"
                  : `${unreadCount} unread · ${items.length - unreadCount} read`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => refresh(true)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 flex-1 sm:flex-none"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-200 transition hover:scale-105 hover:shadow-xl hover:shadow-blue-300 active:scale-95 disabled:opacity-60 flex-1 sm:flex-none"
              >
                {markingAll ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCheck size={15} />
                )}
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* ─── Category Tabs ──────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-sm border border-slate-200/50">
          {CATEGORY_TABS.map((tab) => {
            const count =
              tab.key === "all"
                ? items.length
                : items.filter((i) => CATEGORY_BY_TYPE[i.type] === tab.key)
                    .length;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setCategory(tab.key)}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                  category === tab.key
                    ? "bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-xs ${
                        category === tab.key
                          ? "bg-white/20"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* ─── Feed ────────────────────────────────────────────────── */}
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 text-center">
            <Bell className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-500">Nothing here</p>
            <p className="text-sm text-slate-400">
              {category === "all"
                ? "You're all caught up."
                : "No notifications in this category."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => {
              const Icon = TYPE_ICON[item.type] || Bell;
              const isNew = !item.read;
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group flex items-start gap-3 rounded-2xl border-l-4 bg-white p-4 shadow-sm transition hover:shadow-md cursor-pointer ${
                    SEVERITY_STYLE[item.severity]
                  } ${isNew ? "ring-1 ring-blue-200" : ""}`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${SEVERITY_ICON_COLOR[item.severity]}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-800">
                        {item.title}
                      </p>
                      {isNew && (
                        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {item.message}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(item, e)}
                    title="Delete"
                    className="shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
