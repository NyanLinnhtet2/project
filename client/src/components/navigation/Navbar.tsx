import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    {
      title: "Home",
      path: "/",
    },
    {
      title: "About",
      path: "/about",
    },
    {
      title: "Features",
      path: "/#features",
    },
    {
      title: "Contact",
      path: "/contact",
    },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-amber-100 bg-[#FAF7F2]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        {/* Logo */}

        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B27B32] text-white shadow-lg">

            {/* Clothes Hanger */}

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 6a4 4 0 1 0-8 0" />
              <path d="M12 10l-8 5h16l-8-5z" />
            </svg>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#1A1105]">
              ClothHub
            </h2>

            <p className="text-xs text-[#8C7E6B]">
              Distributed Shop System
            </p>
          </div>
        </Link>

        {/* Desktop Menu */}

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.path}
              className={({ isActive }) =>
                `text-sm font-semibold transition ${
                  isActive
                    ? "text-[#B27B32]"
                    : "text-[#5B4A37] hover:text-[#B27B32]"
                }`
              }
            >
              {item.title}
            </NavLink>
          ))}
        </nav>

        {/* Right */}

        <div className="hidden lg:flex items-center gap-3">

          <Link
            to="/login"
            className="rounded-xl border border-[#DCCFB9] bg-white px-5 py-2.5 text-sm font-semibold text-[#5B4A37] transition hover:border-[#B27B32] hover:text-[#B27B32]"
          >
            Login
          </Link>

        </div>

        {/* Mobile Button */}

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-xl border border-[#DCCFB9] p-2 lg:hidden"
        >
          {menuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}

      {menuOpen && (
        <div className="border-t border-amber-100 bg-[#FAF7F2] lg:hidden">
          <div className="space-y-2 px-6 py-5">

            {navItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#B27B32] text-white"
                      : "text-[#5B4A37] hover:bg-amber-100"
                  }`
                }
              >
                {item.title}
              </NavLink>
            ))}

            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-3 block rounded-xl bg-[#B27B32] px-4 py-3 text-center font-semibold text-white hover:bg-[#996526]"
            >
              Login
            </Link>

          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;