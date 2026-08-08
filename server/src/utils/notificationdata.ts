import { Model } from "mongoose";
import { getCentralDiscountApprovalRequestModel } from "../models/CentralDB/discountApproval";
import { getCentralStockEditRequestModel } from "../models/CentralDB/stockEditRequest";
import { getCentralEmployeeStatusRequestModel } from "../models/CentralDB/employeeStatusRequest";
import {
  getCentralTransferModel,
  ITransfer,
} from "../models/CentralDB/transfers";
import { getCentralCustomerModel } from "../models/CentralDB/customer";
import { getBranchConnection } from "../db/db";
import { getBranchStockModel } from "../models/BranchDB/stock";
import { isBirthdayToday } from "./birthdaycoupon";
import type { BranchLite, ReportSale } from "./reportData";

export interface DerivedNotification {
  id: string; // synthetic, e.g. "discount:<mongoId>" — stable across polls
  type: string;
  severity: "info" | "warning" | "urgent";
  title: string;
  message: string;
  link: string;
  createdAt: Date;
}

// Everything here is still-pending / still-true right now — nothing is
// persisted, so there's no read/unread state and no risk of staleness.
// It disappears from the feed on its own once approved/rejected/resolved.
export const getDerivedNotifications = async (
  role: "admin" | "manager",
  branches: BranchLite[],
  todaysSales: ReportSale[],
): Promise<DerivedNotification[]> => {
  const branchIds = branches.map((b) => b._id);
  const items: DerivedNotification[] = [];

  // ---- Discount approval requests awaiting THIS role's action ----
  const DiscountApprovalRequest = getCentralDiscountApprovalRequestModel();
  const discountFilter: Record<string, unknown> = {
    status: "pending",
    requiredApproverLevel: role,
  };
  if (role === "manager") discountFilter.branchId = { $in: branchIds };
  const discountRequests = await DiscountApprovalRequest.find(
    discountFilter,
  ).sort({
    createdAt: -1,
  });
  for (const r of discountRequests) {
    items.push({
      id: `discount:${r._id}`,
      type: "discount_approval",
      severity: "urgent",
      title: "Discount approval needed",
      message: `${r.cashierName} at ${r.branchName} requested a discount on a ${r.totalAmount.toLocaleString()} Ks sale.`,
      link: role === "admin" ? "/admin/approvals" : "/manager/approvals",
      createdAt: r.createdAt,
    });
  }

  // ---- Stock edit requests (admin reviews these) ----
  if (role === "admin") {
    const StockEditRequest = getCentralStockEditRequestModel();
    const stockEditRequests = await StockEditRequest.find({ status: "PENDING" })
      .populate("productId", "name")
      .sort({ createdAt: -1 });
    for (const r of stockEditRequests) {
      const productName =
        (r.productId as unknown as { name?: string })?.name || "a product";
      items.push({
        id: `stock_edit:${r._id}`,
        type: "stock_edit",
        severity: "warning",
        title: "Stock edit request",
        message: `${r.requestedBy} requested changing "${productName}" from ${r.currentQuantity} to ${r.requestedQuantity}.`,
        link: "/admin/inventory",
        createdAt: r.createdAt,
      });
    }

    // ---- Employee status change requests (admin reviews these) ----
    const EmployeeStatusRequest = getCentralEmployeeStatusRequestModel();
    const employeeRequests = await EmployeeStatusRequest.find({
      status: "PENDING",
    }).sort({
      createdAt: -1,
    });
    for (const r of employeeRequests) {
      items.push({
        id: `employee_status:${r._id}`,
        type: "employee_status",
        severity: "warning",
        title: "Employee status change request",
        message: `${r.requestedBy} requested changing ${r.employeeName} (${r.branch}) from ${r.currentStatus} to ${r.requestedStatus}.`,
        link: "/admin/staff-requests",
        createdAt: r.createdAt,
      });
    }

    // ---- Stock transfer requests (admin approves these) ----
    const Transfer = getCentralTransferModel() as Model<ITransfer>;
    const transferRequests = await Transfer.find({ status: "pending" })
      .populate("fromBranchId", "name")
      .populate("toBranchId", "name")
      .populate("productId", "name")
      .sort({ createdAt: -1 });
    for (const r of transferRequests) {
      const fromName =
        (r.fromBranchId as unknown as { name?: string })?.name || "a branch";
      const toName =
        (r.toBranchId as unknown as { name?: string })?.name || "a branch";
      const productName =
        (r.productId as unknown as { name?: string })?.name || "a product";
      items.push({
        id: `transfer:${r._id}`,
        type: "transfer_request",
        severity: "info",
        title: "Stock transfer request",
        message: `${r.quantity} x ${productName} requested from ${fromName} to ${toName}.`,
        link: "/admin/inventory",
        createdAt: r.createdAt,
      });
    }
  }

  // ---- Low / out-of-stock products in this scope ----
  for (const branch of branches) {
    const branchDb = getBranchConnection(branch.dbName);
    const Stock = getBranchStockModel(branchDb);
    const lowStock = await Stock.find({
      status: { $in: ["Low Stock", "Out of Stock"] },
    })
      .populate("productId", "name")
      .limit(20);
    for (const s of lowStock) {
      const productName =
        (s.productId as unknown as { name?: string })?.name || "A product";
      items.push({
        id: `low_stock:${branch._id}:${s.productId}`,
        type: "low_stock",
        severity: s.status === "Out of Stock" ? "urgent" : "warning",
        title: s.status === "Out of Stock" ? "Out of stock" : "Low stock",
        message: `${productName} at ${branch.name} — ${s.quantity} left.`,
        link: role === "admin" ? "/admin/inventory" : "/manager/my-inventory",
        // Not otherwise timestamped — surface it as "now" each poll rather
        // than trying to track when it first crossed the threshold.
        createdAt: new Date(),
      });
    }
  }

  // ---- Sales voided today, in this scope ----
  const voidedToday = todaysSales.filter((s) => s.status === "voided");
  for (const s of voidedToday) {
    items.push({
      id: `voided_sale:${s._id}`,
      type: "voided_sale",
      severity: "warning",
      title: "Sale voided",
      message: `${s.saleNumber} at ${s.branchName} was voided by ${s.voidedByName || "someone"}${
        s.voidedReason ? ` — "${s.voidedReason}"` : ""
      }.`,
      link: role === "admin" ? "/admin/sales" : "/manager/sales",
      createdAt: s.voidedAt || s.createdAt,
    });
  }

  // ---- Customer birthdays today (global — same for both roles) ----
  const Customer = getCentralCustomerModel();
  const customersWithDob = await Customer.find({
    dateOfBirth: { $exists: true },
  }).select("name dateOfBirth");
  const birthdaysToday = customersWithDob.filter((c) =>
    isBirthdayToday(c.dateOfBirth),
  );
  for (const c of birthdaysToday) {
    items.push({
      id: `birthday:${c._id}`,
      type: "birthday",
      severity: "info",
      title: "Customer birthday today",
      message: `${c.name}'s birthday is today.`,
      link:
        role === "admin"
          ? `/admin/customers/${c._id}`
          : `/manager/customers/${c._id}`,
      createdAt: new Date(),
    });
  }

  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};
