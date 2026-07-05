import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/navigation/Sidebar"; // Sidebar ဖိုင်လမ်းကြောင်း

export const AdminLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ဘယ်ဘက်ခြမ်းမှ Sidebar */}
      <Sidebar />

      {/* ညာဘက်ခြမ်းမှ အဓိက Content ပြသမည့် နေရာ */}
      <div className="flex-1 flex flex-col">
        {/* Header အသေးစားလေး ထည့်ထားပါသည် */}
        <header className="bg-white shadow-sm p-4 flex justify-end items-center">
          <span className="font-medium text-gray-700">
            Welcome, Super Admin
          </span>
        </header>

        {/* သက်ဆိုင်ရာ Page များကို ဤနေရာတွင် Render လုပ်ပါမည် */}
        <main className="p-6 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
