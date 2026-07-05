import React from "react";
import { NavLink } from "react-router-dom";

export const Sidebar: React.FC = () => {
  return (
    <div className="w-64 h-screen bg-gray-800 text-white flex flex-col">
      <div className="p-5 text-2xl font-bold border-b border-gray-700">
        Admin Panel
      </div>
      <nav className="flex flex-col p-4 gap-2">
        <NavLink
          to="/admin/overview"
          className={({ isActive }) =>
            `p-3 rounded-lg hover:bg-gray-700 transition-colors ${
              isActive ? "bg-gray-700 font-semibold" : ""
            }`
          }
        >
          Overview
        </NavLink>
        <NavLink
          to="/admin/branches"
          className={({ isActive }) =>
            `p-3 rounded-lg hover:bg-gray-700 transition-colors ${
              isActive ? "bg-gray-700 font-semibold" : ""
            }`
          }
        >
          Branches
        </NavLink>
        <NavLink
          to="/admin/products"
          className={({ isActive }) =>
            `p-3 rounded-lg hover:bg-gray-700 transition-colors ${
              isActive ? "bg-gray-700 font-semibold" : ""
            }`
          }
        >
          Products
        </NavLink>
        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            `p-3 rounded-lg hover:bg-gray-700 transition-colors ${
              isActive ? "bg-gray-700 font-semibold" : ""
            }`
          }
        >
          Settings
        </NavLink>
      </nav>
    </div>
  );
};