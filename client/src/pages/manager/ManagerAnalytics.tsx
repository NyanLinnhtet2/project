export const ManagerAnalytics = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-emerald-50/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Data insights and analytics
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">Revenue Overview</h3>
            <div className="mt-4 h-64 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
              Revenue Chart
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">Top Products</h3>
            <div className="mt-4 h-64 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
              Product Performance Chart
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">Branch Performance</h3>
            <div className="mt-4 h-48 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
              Branch Comparison
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">
              Category Distribution
            </h3>
            <div className="mt-4 h-48 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
              Category Chart
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">Customer Insights</h3>
            <div className="mt-4 h-48 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
              Customer Analytics
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
