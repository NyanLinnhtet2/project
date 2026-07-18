// src/pages/manager/Reports.tsx
import { FileText, TrendingUp, Users, Package, Download, Printer } from "lucide-react";

export const ManagerReports = () => {
  const reportTypes = [
    { title: "Sales Report", icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
    { title: "Inventory Report", icon: Package, color: "bg-blue-50 text-blue-600" },
    { title: "Employee Report", icon: Users, color: "bg-violet-50 text-violet-600" },
    { title: "Branch Report", icon: FileText, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
          <p className="mt-0.5 text-sm text-slate-500">Generate and download reports</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <div
                key={report.title}
                className="group rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${report.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{report.title}</h3>
                <p className="mt-1 text-sm text-slate-500">View detailed report</p>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200">
                    <Download size={14} className="inline mr-1" />
                    Export
                  </button>
                  <button className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200">
                    <Printer size={14} className="inline mr-1" />
                    Print
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Reports */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Reports</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 hover:bg-slate-50/50 transition">
                <div>
                  <p className="font-medium text-slate-900">Sales Report - Week {i}</p>
                  <p className="text-sm text-slate-500">Generated on Jan {i + 10}, 2024</p>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200">
                    <Download size={16} />
                  </button>
                  <button className="rounded-lg bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200">
                    <Printer size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};