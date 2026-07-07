// src/controllers/branchController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getCentralUserModel } from "../models/CentralDB/user";
import { getBranchConnection } from "../db/db";
// Create Branch
export const createBranch = async (req: Request, res: Response) => {
  try {
    const Branch = getCentralBranchModel();
    const { name, code, address, phone, email, manager, status } = req.body;

    const existingBranch = await Branch.findOne({ code });
    if (existingBranch) {
      return res.status(400).json({
        success: false,
        message: "Branch code already exists",
      });
    }

    const branchDbName = `branch_${code.toLowerCase()}`;

    const assignedManager =
      manager && manager.trim() !== "" ? manager : "Not Assigned";

    const newBranch = await Branch.create({
      name,
      code,
      address,
      phone,
      email,
      manager: assignedManager,
      dbName: branchDbName,
      status: status || "active",
    });

    const branchDb = getBranchConnection(branchDbName);

    const ConfigSchema = new mongoose.Schema({
      branchId: String,
      initializedAt: { type: Date, default: Date.now },
    });

    const ConfigModel =
      branchDb.models.SystemConfig ||
      branchDb.model("SystemConfig", ConfigSchema);

    await ConfigModel.create({
      branchId: newBranch._id.toString(),
    });

    return res.status(201).json({
      success: true,
      message: "Branch and its Database created successfully",
      data: newBranch,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Get all branches with optional filters
export const getBranches = async (req: Request, res: Response) => {
  try {
    const Branch = getCentralBranchModel();
    const { status, search } = req.query;

    // Build filter object
    const filter: any = {};

    // Filter by status
    if (status && status !== "All") {
      filter.status = status;
    }

    // Search by name, code, or manager
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { manager: { $regex: search, $options: "i" } },
      ];
    }

    const branches = await Branch.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: branches,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Get branch by ID
export const getBranchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const Branch = getCentralBranchModel();

    const branch = await Branch.findById(id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: branch,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const updateBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const Branch = getCentralBranchModel();
    
    const { code, ...updateData } = req.body;

    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      data: updatedBranch,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const Branch = getCentralBranchModel();

    const deletedBranch = await Branch.findByIdAndDelete(id);

    if (!deletedBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    // မှတ်ချက် - Central DB မှ Branch Data ကို ဖျက်လိုက်ခြင်းဖြစ်ပါသည်။
    // အကယ်၍ Branch Database (branch_xxx) ကိုပါ အပြီးတိုင် ဖျက်ချင်ပါက mongoose connection မှတဆင့် `db.dropDatabase()` ကို ဆက်လက်ရေးသားနိုင်ပါသည်။

    return res.status(200).json({
      success: true,
      message: "Branch deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Get branch stats
export const getBranchStats = async (req: Request, res: Response) => {
  try {
    const Branch = getCentralBranchModel();
    const CentralUser = getCentralUserModel();

    const total = await Branch.countDocuments();
    const active = await Branch.countDocuments({ status: "active" });
    const inactive = await Branch.countDocuments({ status: "inactive" });

    // Get employees count per branch
    const branchesWithEmployees = await Branch.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "name",
          foreignField: "branch",
          as: "employees",
        },
      },
      {
        $project: {
          name: 1,
          code: 1,
          status: 1,
          manager: 1,
          employeeCount: { $size: "$employees" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        active,
        inactive,
        branches: branchesWithEmployees,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Update branch status only
export const updateBranchStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be active or inactive",
      });
    }

    const Branch = getCentralBranchModel();
    const CentralUser = getCentralUserModel();

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    // Update branch status
    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    // Update all employees in this branch
    await CentralUser.updateMany(
      { branch: branch.name },
      { status: status === "active" ? "active" : "inactive" },
    );

    return res.status(200).json({
      success: true,
      message: `Branch status updated to ${status}`,
      data: updatedBranch,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
