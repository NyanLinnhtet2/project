import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import type { NavLinkRenderProps } from "react-router-dom";
import {
  Menu,
  X,
  ShoppingBag,
  LogIn,
  Home,
  Info,
  Phone,
  ChevronDown,
} from "lucide-react";

import { useAuth } from "../../context/useAuth";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    {
      title: "Home",
      path: "/",
      icon: Home,
    },
    {
      title: "About",
      path: "/about",
      icon: Info,
    },
    {
      title: "Contact",
      path: "/contact",
      icon: Phone,
    },
  ];

  const { userInfo } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 transition-all group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-blue-300">
            <ShoppingBag size={24} />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white"></div>
          </div>
          <div>
            <h2 className="text-xl font-bold bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              ClothHub
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Distributed Shop System
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.title}
                to={item.path}
                className={({ isActive }: NavLinkRenderProps) =>
                  `group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                  }`
                }
              >
                {({ isActive }: NavLinkRenderProps) => (
                  <>
                    <Icon
                      size={18}
                      className={`transition-transform duration-300 ${
                        isActive ? "scale-110" : "group-hover:scale-110"
                      }`}
                    />
                    <span>{item.title}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-linear-to-r from-blue-600 to-blue-700"></div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {userInfo ? (
            <Link
              to="/admin/overviews"
              className="group inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-300 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:shadow-lg hover:shadow-blue-300 hover:scale-105 active:scale-95"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    userInfo?.image?.url ||
                    `https://ui-avatars.com/api/?name=${userInfo?.name}&background=random`
                  }
                  alt="User Avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-slate-700">
                  {userInfo?.name}
                </span>
              </div>
            </Link>
          ) : (
            <Link
              to="/login"
              className="group cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:shadow-lg hover:shadow-blue-300 hover:scale-105 active:scale-95"
            >
              <LogIn
                size={18}
                className="transition-transform duration-300 group-hover:scale-110"
              />
              Login
            </Link>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="relative rounded-2xl border border-slate-200 bg-white p-2.5 transition-all hover:bg-slate-50 hover:shadow-md lg:hidden"
        >
          {menuOpen ? (
            <X size={22} className="text-slate-600" />
          ) : (
            <Menu size={22} className="text-slate-600" />
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200/60 bg-white/95 backdrop-blur-xl lg:hidden">
          <div className="space-y-1 px-6 py-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.title}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }: NavLinkRenderProps) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200"
                        : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                    }`
                  }
                >
                  {({ isActive }: NavLinkRenderProps) => (
                    <>
                      <Icon size={20} />
                      <span>{item.title}</span>
                      {isActive && (
                        <ChevronDown size={16} className="ml-auto rotate-270" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}

            <div className="mt-4 grid grid-cols-2 gap-3">
              {userInfo ? (
                <Link
                  to="/admin/overviews"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-300 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:shadow-lg hover:shadow-blue-300 hover:scale-105 active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        userInfo?.image?.url ||
                        `https://ui-avatars.com/api/?name=${userInfo?.name}&background=random`
                      }
                      alt="User Avatar"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {userInfo?.name}
                    </span>
                  </div>
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center cursor-pointer gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-4 py-3.5 font-semibold text-white shadow-md shadow-blue-200 transition-all hover:shadow-lg hover:shadow-blue-300 active:scale-95"
                >
                  <LogIn size={18} />
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200/60">
              <p className="text-center text-xs text-slate-400">
                © 2024 ClothHub. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
