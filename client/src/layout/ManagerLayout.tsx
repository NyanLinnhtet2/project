import { Outlet } from "react-router-dom";
import { ManagerSidebar } from "../components/navigation/ManagerSidebar";

export const ManagerLayout = () => {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <ManagerSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};
