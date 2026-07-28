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

export interface ReportSummary {
  cashierPerformance: CashierPerformance[];
  categoryBreakdown: CategoryBreakdown[];
  discountReturnRate: DiscountReturnRate;
}

export interface GetReportSummaryParams {
  branchId?: string;
  startDate?: string;
  endDate?: string;
}