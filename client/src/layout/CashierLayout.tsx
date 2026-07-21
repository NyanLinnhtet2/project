import { Outlet } from "react-router-dom";
import { CashierSidebar } from "../components/navigation/CashierSidbar";

export const CashierLayout = () => {
  return (
    <div className="flex h-screen bg-slate-50">
      <CashierSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};