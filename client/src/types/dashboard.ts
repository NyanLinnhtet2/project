export interface DashboardToday {
  revenue: number;
  transactions: number;
  avgBasket: number;
}

export interface DashboardTrendPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  transactions: number;
}

export interface DashboardPaymentItem {
  method: string;
  amount: number;
  count: number;
}

export interface DashboardCategoryItem {
  category: string;
  revenue: number;
  quantity: number;
}

export interface DashboardTopProduct {
  name: string;
  revenue: number;
  quantity: number;
}

export interface DashboardBranchItem {
  branchName: string;
  revenue: number;
  transactionCount: number;
}

export interface DashboardRecentSale {
  saleNumber: string;
  cashierName: string;
  branchName: string;
  totalAmount: number;
  status: "completed" | "voided";
  createdAt: string;
}

export interface DashboardCouponItem {
  type: string; // "birthday" | "level_up" | "unknown"
  count: number;
}

export interface DashboardCounts {
  totalBranches: number;
  totalProducts: number;
  totalCustomers: number;
  pendingApprovals: number;
  birthdaysToday: number;
  lowStockCount: number;
}

export interface DashboardOverview {
  today: DashboardToday;
  weeklyTrend: DashboardTrendPoint[];
  paymentBreakdown: DashboardPaymentItem[];
  categoryBreakdown: DashboardCategoryItem[];
  topProducts: DashboardTopProduct[];
  branchComparison: DashboardBranchItem[];
  recentSales: DashboardRecentSale[];
  couponBreakdown: DashboardCouponItem[];
  counts: DashboardCounts;
}