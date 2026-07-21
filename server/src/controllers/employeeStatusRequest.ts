import { Request, Response } from "express";
import mongoose from "mongoose";
import { getCentralUserModel } from "../models/CentralDB/user";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getBranchConnection } from "../db/db";
import { getBranchEmployeeModel } from "../models/BranchDB/employee";
import { getCentralEmployeeStatusRequestModel } from "../models/CentralDB/employeeStatusRequest";

const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

const syncStatusToBranchDB = async (
  branchName: string,
  email: string,
  status: "active" | "inactive" | "suspended",
) => {
  try {
    const Branch = getCentralBranchModel();
    const branch = await Branch.findOne({ name: branchName });
    if (!branch) return;

    const branchDb = getBranchConnection(branch.dbName);
    const BranchEmployee = getBranchEmployeeModel(branchDb);
    await BranchEmployee.findOneAndUpdate({ email }, { status });
  } catch (error) {
    console.error("Error syncing employee status to branch DB:", error);
    // Sync failure shouldn't block the approval itself
  }
};

// 🌟 Manager: Employee status ပြောင်းချင်ရင် Request တင်ခြင်း
export const requestEmployeeStatusChange = async (
  req: Request,
  res: Response,
) => {
  try {
    const { employeeId, requestedStatus, reason, requestedBy } = req.body;

    if (!employeeId || !requestedStatus || !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, Requested Status, and Reason are required!",
      });
    }

    if (!isValidObjectId(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Employee ID format",
      });
    }

    const allowedStatuses = ["active", "inactive", "suspended"];
    if (!allowedStatuses.includes(requestedStatus)) {
      return res.status(400).json({
        success: false,
        message: `requestedStatus must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const CentralUser = getCentralUserModel();
    const employee = await CentralUser.findById(employeeId);

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    if (employee.status === requestedStatus) {
      return res.status(400).json({
        success: false,
        message: "Requested status is the same as current status",
      });
    }

    const EmployeeStatusRequest = getCentralEmployeeStatusRequestModel();
    const request = await EmployeeStatusRequest.create({
      employeeId: employee._id,
      employeeName: employee.name,
      branch: employee.branch,
      currentStatus: employee.status,
      requestedStatus,
      reason: reason.trim(),
      requestedBy: requestedBy || "Manager",
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      data: request,
      message: "Status change request submitted. Waiting for admin approval.",
    });
  } catch (error: any) {
    console.error("❌ Request Employee Status Change Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// 🌟 Admin/Manager: Requests list ကြည့်ခြင်း
export const getEmployeeStatusChangeRequests = async (
  req: Request,
  res: Response,
) => {
  try {
    const { branch, status } = req.query;

    const filter: any = {};
    if (branch && typeof branch === "string") filter.branch = branch;
    if (status && typeof status === "string") filter.status = status;

    const EmployeeStatusRequest = getCentralEmployeeStatusRequestModel();
    const requests = await EmployeeStatusRequest.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({ success: true, data: requests });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// 🌟 Admin: Approve — User.status ကို တကယ်ပြောင်းပြီး branch DB ကိုပါ sync လုပ်ပါမည်
export const approveEmployeeStatusChangeRequest = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { reviewedBy, adminNote } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request ID" });
    }

    const EmployeeStatusRequest = getCentralEmployeeStatusRequestModel();
    const editRequest = await EmployeeStatusRequest.findById(id);

    if (!editRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }
    if (editRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${editRequest.status.toLowerCase()}`,
      });
    }

    const CentralUser = getCentralUserModel();
    const employee = await CentralUser.findById(editRequest.employeeId);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // Re-check: request တင်ချိန်နဲ့ approve ချိန်ကြား status ပြောင်းမသွားလား
    if (employee.status !== editRequest.currentStatus) {
      return res.status(409).json({
        success: false,
        message: `Employee status has changed since this request was made (was ${editRequest.currentStatus}, now ${employee.status}). Please reject and ask manager to resubmit.`,
      });
    }

    employee.status = editRequest.requestedStatus;
    await employee.save();

    await syncStatusToBranchDB(
      employee.branch,
      employee.email,
      editRequest.requestedStatus,
    );

    editRequest.status = "APPROVED";
    editRequest.reviewedBy = reviewedBy || "Admin";
    editRequest.reviewedAt = new Date();
    editRequest.adminNote = adminNote || "";
    await editRequest.save();

    return res.status(200).json({
      success: true,
      data: employee,
      request: editRequest,
      message: "Status change request approved and employee updated",
    });
  } catch (error: any) {
    console.error("❌ Approve Employee Status Change Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// 🌟 Admin: Reject — employee status ဘာမှ မပြောင်းပါ
export const rejectEmployeeStatusChangeRequest = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { reviewedBy, adminNote } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request ID" });
    }

    const EmployeeStatusRequest = getCentralEmployeeStatusRequestModel();
    const editRequest = await EmployeeStatusRequest.findById(id);

    if (!editRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }
    if (editRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${editRequest.status.toLowerCase()}`,
      });
    }

    editRequest.status = "REJECTED";
    editRequest.reviewedBy = reviewedBy || "Admin";
    editRequest.reviewedAt = new Date();
    editRequest.adminNote = adminNote || "";
    await editRequest.save();

    return res.status(200).json({
      success: true,
      data: editRequest,
      message: "Status change request rejected",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};