// src/components/manager/ManagerSidebar.tsx
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  GitBranch,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  LogOut,
  Store,
  BarChart3,
  ClipboardList,
  TrendingUp,
  Bell,
  HelpCircle,
  ChevronRight,
  Sparkles,
  
} from "lucide-react";
import { logoutUser } from "../../services/authServices";

const menus = [
  {
    title: "Dashboard",
    path: "/manager/overviews",
    icon: LayoutDashboard,
  },
  {
    title: "Branch Transfers",
    path: "/manager/transfers",
    icon: GitBranch,
  },
  {
    title: "Products",
    path: "/manager/products",
    icon: Package,
  },
  {
    title: "Inventory",
    path: "/manager/my-inventory",
    icon: ClipboardList,
  },
  {
    title: "Orders",
    path: "/manager/orders",
    icon: ShoppingCart,
  },
  {
    title: "Employees",
    path: "/manager/employees",
    icon: Users,
  },
  {
    title: "Reports",
    path: "/manager/reports",
    icon: FileText,
  },
  {
    title: "Analytics",
    path: "/manager/analytics",
    icon: BarChart3,
  },
  {
    title: "Stock Request",
    path: "/manager/stock-request",
    icon: ClipboardList,
  },
];

export const ManagerSidebar = () => {
  const navigate = useNavigate();

  const logoutHandler = async () => {
    try {
      const response = await logoutUser();
      console.log(response);
      localStorage.removeItem("userInfo");
      navigate("/login");
    } catch (error) {
      console.log("Logout Error : ", error);
    }
  };

  return (
    <aside className="flex h-screen w-80 flex-col bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl shadow-slate-900/50 overflow-hidden">
      {/* Decorative Top Gradient Line */}
      <div className="h-1 bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 shrink-0"></div>

      {/* Logo Section */}
      <div className="shrink-0 border-b border-slate-700/50 px-7 py-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="rounded-2xl bg-linear-to-br from-emerald-400 to-emerald-600 p-2.5 shadow-lg shadow-emerald-500/30">
              <Store size={24} className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles size={12} className="text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Retail<span className="text-emerald-400">POS</span>
            </h1>
            <p className="text-xs text-slate-400">Manager Portal</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="shrink-0 mx-5 mt-4 rounded-2xl bg-linear-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 p-4 border border-slate-700/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Today's Sales</p>
            <p className="text-2xl font-bold text-white">$4,850</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30">
            <TrendingUp size={20} className="text-emerald-400" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/30">
            <span className="text-emerald-400">↑</span> 12%
          </span>
          <span className="text-xs text-slate-400">vs yesterday</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-1 px-4 py-5 min-h-0">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Main Menu
        </p>
        {menus.map((menu) => {
          const Icon = menu.icon;

          return (
            <NavLink
              key={menu.title}
              to={menu.path}
              className={({ isActive }) =>
                `group relative flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-linear-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-white/20"
                        : "bg-slate-800/50 group-hover:bg-slate-700/50"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 transition-all duration-300 ${
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-white"
                      }`}
                    />
                  </span>
                  <span className="flex-1">{menu.title}</span>
                  {isActive && (
                    <div className="flex items-center gap-1">
                      <ChevronRight size={16} className="text-white/70" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute right-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-l-full bg-white"></div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="shrink-0 border-t border-slate-700/50 p-5">
        {/* User Profile */}
        <div className="group relative mb-3 rounded-2xl bg-slate-800/50 p-3 border border-slate-700/50 transition-all hover:border-slate-600 hover:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                <span className="text-lg font-bold">M</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-800 bg-emerald-400 animate-pulse"></div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Manager</h3>
              <p className="text-xs text-slate-400">manager@clothhub.com</p>
            </div>
            <button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-white">
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-3 flex gap-2">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white">
            <Bell size={16} />
            <span>Alerts</span>
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white">
            <HelpCircle size={16} />
            <span>Help</span>
          </button>
        </div>

        {/* Logout Button */}
        <button
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/50 bg-linear-to-r from-red-900/20 to-red-800/20 py-3 font-medium text-red-400 transition-all hover:from-red-900/40 hover:to-red-800/40 hover:border-red-700/50 hover:shadow-lg hover:shadow-red-900/20 active:scale-95"
          onClick={logoutHandler}
        >
          <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
          <span>Logout</span>
        </button>

        {/* Version */}
        <p className="mt-3 text-center text-[10px] text-slate-600">
          Version 2.0.1 • © 2024 Retail POS
        </p>
      </div>
    </aside>
  );
};
