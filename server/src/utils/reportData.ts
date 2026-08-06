import { Types } from "mongoose";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getBranchConnection } from "../db/db";
import { getSaleModel, ISale } from "../models/BranchDB/sale";
import { getReturnModel, IReturn } from "../models/BranchDB/return";

export interface BranchLite {
  _id: Types.ObjectId;
  name: string;
  dbName: string;
}

interface DateRange {
  startDate?: string;
  endDate?: string;
}

// Manager: always their own branch. Admin: the one branch they picked via
// ?branchId=, or every branch if they didn't (company-wide report).
export const resolveReportBranches = async (
  role: string,
  userBranch: string,
  queryBranchId?: string,
): Promise<BranchLite[]> => {
  const Branch = getCentralBranchModel();
  if (role === "manager") {
    const branch = await Branch.findOne({ name: userBranch });
    return branch ? [branch] : [];
  }
  if (queryBranchId) {
    const branch = await Branch.findById(queryBranchId);
    return branch ? [branch] : [];
  }
  return Branch.find();
};

const buildDateFilter = (range: DateRange): Record<string, unknown> => {
  if (!range.startDate && !range.endDate) return {};
  const createdAt: Record<string, Date> = {};
  if (range.startDate) createdAt.$gte = new Date(range.startDate);
  if (range.endDate) createdAt.$lte = new Date(range.endDate);
  return { createdAt };
};

export interface ReportSale extends ISale {
  branchName: string;
}
export interface ReportReturn extends IReturn {
  branchName: string;
}

// Pulls sales + returns from every requested branch's own DB in one pass —
// every Tier-2 metric (cashier performance, category breakdown, discount/
// return rate) is derived from this same pull so branches are only queried
// once per report request, not once per metric.
export const collectSalesAndReturns = async (
  branches: BranchLite[],
  range: DateRange,
): Promise<{ sales: ReportSale[]; returns: ReportReturn[] }> => {
  const filter = buildDateFilter(range);
  const sales: ReportSale[] = [];
  const returns: ReportReturn[] = [];

  for (const branch of branches) {
    const branchDb = getBranchConnection(branch.dbName);
    const Sale = getSaleModel(branchDb);
    const Return = getReturnModel(branchDb);

    const branchSales = await Sale.find(filter);
    const branchReturns = await Return.find(filter);

    for (const s of branchSales) {
      sales.push(Object.assign(s.toObject(), { branchName: branch.name }));
    }
    for (const r of branchReturns) {
      returns.push(Object.assign(r.toObject(), { branchName: branch.name }));
    }
  }

  return { sales, returns };
};