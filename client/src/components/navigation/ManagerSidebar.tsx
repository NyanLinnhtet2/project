import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  GitBranch,
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
  Clock,
  RotateCcw,
  Menu,
  X,
} from "lucide-react";
import { logoutUser } from "../../services/authServices";
import { useAuth } from "../../context/useAuth";

interface ManagerSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const menus = [
  { title: "Dashboard", path: "/manager/overviews", icon: LayoutDashboard },
  { title: "Inventory", path: "/manager/my-inventory", icon: ClipboardList },
  { title: "Branch Transfers", path: "/manager/transfers", icon: GitBranch },
  { title: "Employees", path: "/manager/employees", icon: Users },
  { title: "Sales", path: "/manager/sales", icon: BarChart3 },
  { title: "Reports", path: "/manager/reports", icon: FileText },
  { title: "Analytics", path: "/manager/analytics", icon: BarChart3 },
  { title: "Discount Approvals", path: "/manager/approvals", icon: Clock },
  { title: "Returns", path: "/manager/returns", icon: RotateCcw },
];

export const ManagerSidebar = ({
  sidebarOpen,
  setSidebarOpen,
}: ManagerSidebarProps) => {
  const navigate = useNavigate();
  const { userInfo, logout } = useAuth();

  const logoutHandler = async () => {
    try {
      const response = await logoutUser();
      console.log(response);
      logout();
      navigate("/login");
    } catch (error) {
      console.log("Logout Error : ", error);
    }
  };

  // Close sidebar on mobile
  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  // Mobile တွင် Sidebar အပိတ်/အဖွင့် Slide Classes
  const mobileClasses = sidebarOpen
    ? "translate-x-0"
    : "-translate-x-full lg:translate-x-0";

  return (
    <>
      {/* Mobile Hamburger Icon (visible when sidebar closed) */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-40 rounded-md bg-white p-2 shadow-md text-slate-700 lg:hidden"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden"
          onClick={closeSidebarOnMobile}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-full flex-col w-72
          bg-linear-to-b from-white to-slate-50/80 shadow-xl shadow-slate-200/50
          transition-all duration-300 ease-in-out
          lg:static lg:z-auto
          ${mobileClasses}
        `}
      >
        {/* Decorative Top Gradient Line */}
        <div className="h-1 bg-linear-to-r from-blue-400 via-indigo-400 to-blue-500 shrink-0"></div>

        {/* Logo Section */}
        <div className="shrink-0 border-b border-slate-200/60 px-3 py-3 lg:px-7 lg:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="rounded-xl bg-linear-to-br from-blue-600 to-blue-700 p-2 shadow-lg shadow-blue-200">
                <Store size={22} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles size={12} className="text-blue-400 animate-pulse" />
              </div>
            </div>
            <div className="overflow-hidden transition-all duration-300 w-auto opacity-100 block">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                Retail<span className="text-blue-600">POS</span>
              </h1>
              <p className="text-xs text-slate-500 whitespace-nowrap">
                Manager Portal
              </p>
            </div>
          </div>

          {/* Close button (mobile only) */}
          <div className="flex items-center gap-2">
            <button
              className="lg:hidden text-slate-500 hover:text-slate-800 p-1"
              onClick={closeSidebarOnMobile}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="shrink-0 mx-5 mt-4 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 p-3.5 border border-blue-100/50 transition-all duration-300 block">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Today's Sales
              </p>
              <p className="text-lg font-bold text-slate-900">$4,850</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm border border-blue-100">
              <TrendingUp size={16} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <span className="text-emerald-500">↑</span> 12%
            </span>
            <span className="text-xs text-slate-400">vs yesterday</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto space-y-1 px-2 py-3 lg:px-4 lg:py-3 min-h-0">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-all duration-300 block">
            Main Menu
          </p>
          {menus.map((menu) => {
            const Icon = menu.icon;
            return (
              <NavLink
                key={menu.title}
                to={menu.path}
                onClick={closeSidebarOnMobile}
                className={({ isActive }) =>
                  `group relative flex items-center gap-4 rounded-xl px-2 py-2.5 text-sm font-medium transition-all duration-300 lg:px-4 ${
                    isActive
                      ? "bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-white/20"
                          : "bg-slate-100/50 group-hover:bg-slate-200/50"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 transition-all duration-300 ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                    </span>
                    <span className="flex-1 overflow-hidden transition-all duration-300 whitespace-nowrap w-auto opacity-100 block">
                      {menu.title}
                    </span>
                    {isActive && (
                      <div className="flex items-center gap-1">
                        <ChevronRight
                          size={16}
                          className="text-white/70 transition-all duration-300 inline"
                        />
                        <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                      </div>
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

        {/* Bottom Section */}
        <div className="shrink-0 border-t border-slate-200/60 p-2 lg:p-4">
          {/* User Profile */}
          <div className="group relative mb-2.5 rounded-2xl bg-white p-2 shadow-sm transition-all hover:shadow-md lg:p-2.5">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200">
                  {userInfo?.image ? (
                    <img
                      src={userInfo.image.url}
                      alt="User avatar"
                      className="h-11 w-11 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="text-base font-bold">
                      {userInfo?.name?.substring(0, 2) || "U"}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"></div>
              </div>
              <div className="flex-1 min-w-0 overflow-hidden transition-all duration-300 w-auto opacity-100 block">
                <h3 className="text-sm font-semibold text-slate-800 truncate">
                  {userInfo?.name || "Loading..."}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {userInfo?.email || "Loading..."}
                </p>
              </div>
              <button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 shrink-0 block">
                <Settings size={15} />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-2.5 gap-2 transition-all duration-300 flex">
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-sm">
              <Bell size={14} />
              <span>Alerts</span>
            </button>
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-sm">
              <HelpCircle size={14} />
              <span>Help</span>
            </button>
          </div>

          {/* Logout Button */}
          <button
            className="group cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-linear-to-r from-red-50 to-red-50/50 py-2 text-sm font-medium text-red-600 transition-all hover:from-red-100 hover:to-red-100 hover:shadow-md hover:shadow-red-200/50 active:scale-95"
            onClick={logoutHandler}
          >
            <LogOut className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
            <span className="transition-all duration-300 whitespace-nowrap inline">
              Logout
            </span>
          </button>

          {/* Version */}
          <p className="mt-2 text-center text-[10px] text-slate-400 transition-all duration-300 block">
            Version 2.0.1 • © 2026 Smart Retail System
          </p>
        </div>
      </aside>
    </>
  );
};