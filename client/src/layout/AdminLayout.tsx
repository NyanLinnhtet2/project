import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/navigation/Sidebar";
import { useState } from "react";

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        collapsed={false}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};
