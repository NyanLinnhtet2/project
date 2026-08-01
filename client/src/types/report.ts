export interface CashierPerformance {
  cashierName: string;
  branchName: string;
  totalRevenue: number;
  transactionCount: number;
  avgBasket: number;
}

export interface CategoryBreakdown {
  category: string;
  revenue: number;
  quantity: number;
}

export interface DiscountReturnRate {
  totalDiscount: number;
  discountRatePercent: number;
  salesWithDiscountCount: number;
  totalTransactions: number;
  totalRefund: number;
  returnRatePercent: number;
  returnCount: number;
}

export interface ReportKpis {
  netRevenue: number;
  grossRevenue: number;
  totalTransactions: number;
  avgBasketSize: number;
  totalRefunded: number;
}

export interface DailyTrendPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
}

export interface PaymentBreakdownItem {
  method: string;
  amount: number;
  count: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  revenue: number;
  quantity: number;
}

export interface BranchComparisonItem {
  branchName: string;
  revenue: number;
  transactionCount: number;
}

export interface CouponTypeBreakdown {
  type: string; // "birthday" | "level_up" | "unknown"
  count: number;
  discount: number;
}

export interface CouponStats {
  redemptionCount: number;
  totalDiscountGiven: number;
  redemptionRatePercent: number;
  breakdown: CouponTypeBreakdown[];
}

export interface ReportSummary {
  kpis: ReportKpis;
  dailyTrend: DailyTrendPoint[];
  paymentBreakdown: PaymentBreakdownItem[];
  topProducts: TopProduct[];
  cashierPerformance: CashierPerformance[];
  categoryBreakdown: CategoryBreakdown[];
  discountReturnRate: DiscountReturnRate;
  branchComparison: BranchComparisonItem[];
  couponStats: CouponStats;
}

export interface GetReportSummaryParams {
  branchId?: string;
  startDate?: string;
  endDate?: string;
}