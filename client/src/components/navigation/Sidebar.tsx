import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  GitBranch,
  Package,
  FileText,
  ShoppingCart,
  Settings,
  LogOut,
  Store,
  User,
  ChevronRight,
  Bell,
} from "lucide-react";
import { logoutUser } from "../../services/authServices";

const menus = [
  {
    title: "Overviews",
    path: "/admin/overviews",
    icon: LayoutDashboard,
  },
  {
    title: "Branches",
    path: "/admin/branches",
    icon: GitBranch,
  },
  {
    title: "Employees",
    path: "/admin/employees",
    icon: User,
  },
  {
    title: "Products",
    path: "/admin/products",
    icon: Package,
  },
  {
    title: "Orders",
    path: "/admin/orders",
    icon: ShoppingCart,
  },
];

export const Sidebar = () => {
  const navigate = useNavigate();

  const logutHandler = async () => {
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
    <aside className="flex h-screen w-72 flex-col bg-linear-to-b from-white to-slate-50/80 shadow-xl shadow-slate-200/50 overflow-hidden">
      {/* Logo Section - Fixed height */}
      <div className="shrink-0 border-b border-slate-200/60 px-7 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-linear-to-br from-blue-600 to-blue-700 p-2 shadow-lg shadow-blue-200">
            <Store size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Retail POS
            </h1>
            <p className="text-xs text-slate-500">Multi Branch Management</p>
          </div>
        </div>
      </div>

      {/* Quick Stats - Fixed height */}
      <div className="shrink-0 mx-5 mt-4 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Today's Sales</p>
            <p className="text-lg font-bold text-slate-900">$4,850</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
            <Package size={16} className="text-blue-600" />
          </div>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <span className="text-emerald-500">↑</span> 12%
          </span>
          <span className="text-xs text-slate-400">vs yesterday</span>
        </div>
      </div>

      {/* Navigation - Takes remaining space with overflow */}
      <nav className="flex-1 overflow-y-auto space-y-1 px-4 py-3 min-h-0">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Main Menu
        </p>
        {menus.map((menu) => {
          const Icon = menu.icon;

          return (
            <NavLink
              key={menu.title}
              to={menu.path}
              className={({ isActive }) =>
                `group relative flex items-center gap-4 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-5 w-5 transition-transform duration-300 ${
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span className="flex-1">{menu.title}</span>
                  {isActive && (
                    <ChevronRight size={16} className="text-white/70" />
                  )}
                  {isActive && (
                    <div className="absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-l-full bg-white"></div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section - Fixed height */}
      <div className="shrink-0 border-t border-slate-200/60 p-4">
        {/* User Profile */}
        <div className="group relative mb-2.5 rounded-2xl bg-white p-2.5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200">
                <span className="text-base font-bold">A</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-800 truncate">
                Admin
              </h3>
              <p className="text-xs text-slate-500 truncate">admin@gmail.com</p>
            </div>
            <button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 shrink-0">
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-2.5 flex gap-2">
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-sm">
            <Bell size={14} />
            <span>Alerts</span>
          </button>
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-sm">
            <FileText size={14} />
            <span>Reports</span>
          </button>
        </div>

        {/* Logout Button */}
        <button
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-linear-to-r from-red-50 to-red-50/50 py-2 text-sm font-medium text-red-600 transition-all hover:from-red-100 hover:to-red-100 hover:shadow-md hover:shadow-red-200/50 active:scale-95"
          onClick={logutHandler}
        >
          <LogOut className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
          <span>Logout</span>
        </button>

        {/* Version */}
        <p className="mt-2 text-center text-[10px] text-slate-400">
          Version 2.0.1 • © 2024 Retail POS
        </p>
      </div>
    </aside>
  );
};
