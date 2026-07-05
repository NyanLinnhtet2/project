import {
  Building2,
  Boxes,
  ShoppingCart,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  Users,
  Package,
  Store,
  Activity,
} from "lucide-react";

// Move stats data outside component
const stats = [
  {
    title: "Total Branches",
    value: 8,
    icon: Building2,
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    change: "+2 New Branches",
    changeType: "increase",
    progress: 85, // Fixed progress value
  },
  {
    title: "Total Products",
    value: "1,248",
    icon: Boxes,
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    change: "+24 Products",
    changeType: "increase",
    progress: 70,
  },
  {
    title: "Today's Sales",
    value: 58,
    icon: ShoppingCart,
    color: "from-violet-500 to-violet-600",
    bg: "bg-violet-50",
    change: "+12 Orders",
    changeType: "increase",
    progress: 65,
  },
  {
    title: "Today's Revenue",
    value: "$4,850",
    icon: DollarSign,
    color: "from-orange-500 to-orange-600",
    bg: "bg-orange-50",
    change: "+18%",
    changeType: "increase",
    progress: 90,
  },
];

// Move data outside component
const recentOrders = [
  {
    id: "#ORD-001",
    customer: "John Doe",
    amount: "$245.00",
    status: "Completed",
  },
  {
    id: "#ORD-002",
    customer: "Jane Smith",
    amount: "$189.50",
    status: "Processing",
  },
  {
    id: "#ORD-003",
    customer: "Bob Johnson",
    amount: "$432.00",
    status: "Completed",
  },
  {
    id: "#ORD-004",
    customer: "Alice Brown",
    amount: "$127.75",
    status: "Pending",
  },
];

const topProducts = [
  { name: "Nike Air Max", sales: 245, revenue: "$12,250" },
  { name: "Adidas Hoodie", sales: 189, revenue: "$9,450" },
  { name: "Puma T-Shirt", sales: 156, revenue: "$7,800" },
  { name: "New Balance Shoes", sales: 98, revenue: "$4,900" },
];

// Sales data for chart
const salesData = [
  { day: "Mon", value: 65 },
  { day: "Tue", value: 78 },
  { day: "Wed", value: 55 },
  { day: "Thu", value: 90 },
  { day: "Fri", value: 82 },
  { day: "Sat", value: 70 },
  { day: "Sun", value: 95 },
];

// Branch performance data
const branchPerformance = [
  { name: "Yangon Branch", percent: 95, color: "bg-blue-500" },
  { name: "Mandalay Branch", percent: 72, color: "bg-emerald-500" },
  { name: "Naypyidaw Branch", percent: 56, color: "bg-violet-500" },
  { name: "Taunggyi Branch", percent: 40, color: "bg-orange-500" },
];

export const Overview = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
                <Activity size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Dashboard Overview
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Monitor all branches, products and sales performance
                </p>
              </div>
            </div>
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
            <button className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300 active:scale-95">
              <TrendingUp size={18} />
              View Reports
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50"
              >
                {/* Decorative background */}
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-linear-to-br from-slate-100 to-transparent opacity-50"></div>

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {item.title}
                      </p>
                      <h2 className="mt-2 text-3xl font-bold text-slate-900">
                        {item.value}
                      </h2>
                    </div>
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg}`}
                    >
                      <Icon className="h-7 w-7 text-slate-700" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                      <ArrowUpRight size={14} />
                      {item.change}
                    </div>
                    <span className="text-xs text-slate-400">Updated now</span>
                  </div>

                  {/* Progress bar with fixed value */}
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full bg-linear-to-r ${item.color}`}
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sales Overview Chart */}
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Sales Overview
                </h2>
                <p className="text-sm text-slate-500">
                  Last 7 days sales performance
                </p>
              </div>
              <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500">
                <option>This Week</option>
                <option>This Month</option>
                <option>This Year</option>
              </select>
            </div>

            <div className="mt-6 h-72">
              {/* Chart visualization */}
              <div className="flex h-full items-end justify-between gap-2">
                {salesData.map((item) => (
                  <div
                    key={item.day}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div
                      className="w-full rounded-lg bg-linear-to-t from-blue-500 to-blue-400 transition-all hover:from-blue-600 hover:to-blue-500"
                      style={{ height: `${item.value}%` }}
                    ></div>
                    <span className="text-xs text-slate-400">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Branch Performance */}
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Branch Performance
                </h2>
                <p className="text-sm text-slate-500">
                  Sales comparison between branches
                </p>
              </div>
              <Store className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-6 space-y-5">
              {branchPerformance.map((branch) => (
                <div key={branch.name} className="group">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {branch.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {branch.percent}%
                      </span>
                      <span className="text-xs text-slate-400">of target</span>
                    </div>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full bg-linear-to-r ${branch.color} transition-all duration-1000 group-hover:opacity-80`}
                      style={{ width: `${branch.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Orders */}
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Recent Orders
                </h2>
                <p className="text-sm text-slate-500">Latest transactions</p>
              </div>
              <ShoppingCart className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {order.id}
                    </p>
                    <p className="text-sm text-slate-500">{order.customer}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold text-slate-900">
                      {order.amount}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        order.status === "Completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : order.status === "Processing"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Top Products
                </h2>
                <p className="text-sm text-slate-500">Best selling items</p>
              </div>
              <Package className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 text-sm font-bold text-white">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {product.sales} sales
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {product.revenue}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 p-6 shadow-lg shadow-blue-200">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div>
              <h3 className="text-xl font-bold text-white">
                Need to manage your business?
              </h3>
              <p className="text-blue-100">
                Quick access to frequently used actions
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-xl bg-white/20 px-5 py-2.5 font-medium text-white backdrop-blur-sm transition hover:bg-white/30">
                <Building2 size={18} className="mr-2 inline" />
                Add Branch
              </button>
              <button className="rounded-xl bg-white/20 px-5 py-2.5 font-medium text-white backdrop-blur-sm transition hover:bg-white/30">
                <Package size={18} className="mr-2 inline" />
                Add Product
              </button>
              <button className="rounded-xl bg-white px-5 py-2.5 font-medium text-blue-600 transition hover:bg-blue-50">
                <Users size={18} className="mr-2 inline" />
                Manage Staff
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
