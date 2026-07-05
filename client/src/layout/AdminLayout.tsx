import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/navigation/Sidebar";

export const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};
