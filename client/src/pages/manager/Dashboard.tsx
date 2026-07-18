import { Package, ShoppingCart, Users, DollarSign } from "lucide-react";

export const ManagerDashboard = () => {
  const stats = [
    {
      title: "Today's Revenue",
      value: "$4,850",
      change: "+12%",
      icon: DollarSign,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Total Orders",
      value: "58",
      change: "+8%",
      icon: ShoppingCart,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Products",
      value: "1,248",
      change: "+5%",
      icon: Package,
      color: "bg-violet-50 text-violet-600",
    },
    {
      title: "Active Employees",
      value: "342",
      change: "+3%",
      icon: Users,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  const recentOrders = [
    {
      id: "#ORD-001",
      customer: "Aung Aung",
      amount: "$245.00",
      status: "Completed",
    },
    {
      id: "#ORD-002",
      customer: "Mya Mya",
      amount: "$189.50",
      status: "Processing",
    },
    {
      id: "#ORD-003",
      customer: "Kyaw Kyaw",
      amount: "$432.00",
      status: "Shipped",
    },
    { id: "#ORD-004", customer: "Su Su", amount: "$127.75", status: "Pending" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Welcome back, Manager! Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white px-5 py-3 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Today's Date</p>
              <h3 className="font-semibold text-slate-900">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </h3>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {stat.title}
                    </p>
                    <h2 className="mt-2 text-3xl font-bold text-slate-900">
                      {stat.value}
                    </h2>
                  </div>
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stat.color}`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1">
                  <span className="text-xs font-medium text-emerald-600">
                    ↑ {stat.change}
                  </span>
                  <span className="text-xs text-slate-400">
                    from last month
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sales Overview */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Sales Overview
                </h2>
                <p className="text-sm text-slate-500">
                  Last 7 days performance
                </p>
              </div>
              <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500">
                <option>This Week</option>
                <option>This Month</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="mt-6 h-72 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
              Sales Chart Here
            </div>
          </div>

          {/* Branch Performance */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Branch Performance
                </h2>
                <p className="text-sm text-slate-500">
                  Sales comparison between branches
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-5">
              {[
                ["Yangon Branch", 95, "bg-emerald-500"],
                ["Mandalay Branch", 72, "bg-blue-500"],
                ["Naypyitaw Branch", 56, "bg-violet-500"],
                ["Taunggyi Branch", 40, "bg-orange-500"],
              ].map(([branch, percent, color]) => (
                <div key={branch}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{branch}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {percent}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${color}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Orders
              </h2>
              <p className="text-sm text-slate-500">
                Latest transactions from all branches
              </p>
            </div>
            <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/50 transition"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {order.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {order.customer}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {order.amount}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          order.status === "Completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : order.status === "Processing"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "Shipped"
                                ? "bg-violet-100 text-violet-700"
                                : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
