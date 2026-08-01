import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ManagerSidebar } from "../components/navigation/ManagerSidebar";

export const ManagerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      <ManagerSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex-1 relative h-full overflow-y-auto w-full transition-all duration-300 ease-in-out">
        <main className="p-4 pt-16 lg:p-8 lg:pt-8 w-full min-h-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
