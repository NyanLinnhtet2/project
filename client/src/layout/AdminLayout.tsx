import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/navigation/Sidebar";
import { useState } from "react";

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        collapsed={false}
      />
      <div className="flex-1 overflow-y-auto">
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
