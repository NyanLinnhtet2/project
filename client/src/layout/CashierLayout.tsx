import { useState } from "react";
import { Outlet } from "react-router-dom";
import { CashierSidebar } from "../components/navigation/CashierSidbar";

export const CashierLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      <CashierSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 relative h-full overflow-y-auto w-full transition-all duration-300 ease-in-out">
        <div className="p-4 pt-16 lg:p-8 lg:pt-8 w-full min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
