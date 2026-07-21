import { NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  History,
  LogOut,
  Store,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { logoutUser } from "../../services/authServices";
import { useAuth } from "../../context/useAuth";

const menus = [
  {
    title: "New Sale",
    path: "/cashier/new-sale",
    icon: ShoppingCart,
  },
  {
    title: "My Sales",
    path: "/cashier/my-sales",
    icon: History,
  },
];

export const CashierSidebar = () => {
  const navigate = useNavigate();
  const { userInfo, logout } = useAuth();

  const logoutHandler = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.log("Logout Error : ", error);
    } finally {
      logout();
      navigate("/login");
    }
  };

  return (
    <aside className="flex h-screen w-72 flex-col bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl shadow-slate-900/50 overflow-hidden">
      <div className="h-1 bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 shrink-0"></div>

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
            <p className="text-xs text-slate-400">Cashier Portal</p>
          </div>
        </div>
      </div>

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
                    <ChevronRight size={16} className="text-white/70" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-700/50 p-5">
        <div className="mb-3 rounded-2xl bg-slate-800/50 p-3 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20">
              <span className="text-lg font-bold">
                {userInfo?.name?.charAt(0)?.toUpperCase() || "C"}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">
                {userInfo?.name || "Cashier"}
              </h3>
              <p className="text-xs text-slate-400">{userInfo?.branch}</p>
            </div>
          </div>
        </div>

        <button
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/50 bg-linear-to-r from-red-900/20 to-red-800/20 py-3 font-medium text-red-400 transition-all hover:from-red-900/40 hover:to-red-800/40 active:scale-95"
          onClick={logoutHandler}
        >
          <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};