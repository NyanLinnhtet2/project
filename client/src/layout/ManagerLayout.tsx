import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ManagerSidebar } from "../components/navigation/ManagerSidebar";

export const ManagerLayout = () => {
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <ManagerSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
       
      />
      <div className="flex-1 overflow-y-auto">
       
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

