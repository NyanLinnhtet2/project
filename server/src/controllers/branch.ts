import { Request, Response } from "express";
import mongoose from "mongoose";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getBranchConnection } from "../db/db";
import { getOrderModel } from "../models/BranchDB/order";
import { getBranchEmployeeModel } from "../models/BranchDB/employee";
import { getCentralUserModel } from "../models/CentralDB/user";

const getBranchStatsFromDB = async (branch: any) => {
  try {
    const branchDb = getBranchConnection(branch.dbName);
    const Order = getOrderModel(branchDb);
    const Employee = getBranchEmployeeModel(branchDb);

    const [employeeStats, revenueData, totalOrders] = await Promise.all([
      // "Not Assigned" ကိုမရေတွက်ရန် Aggregation
      Employee.aggregate([
        {
          $match: {
            status: "active",
            name: { $ne: "Not Assigned" },
          },
        },
        {
          $count: "total",
        },
      ]),
      Order.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.countDocuments({ status: "completed" }),
    ]);

    return {
      employeeCount: employeeStats[0]?.total || 0,
      revenue: revenueData[0]?.total || 0,
      totalOrders,
    };
  } catch (error) {
    console.error(`Error fetching stats for branch ${branch._id}:`, error);
    return {
      employeeCount: 0,
      revenue: 0,
      totalOrders: 0,
    };
  }
};

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

    // System Config ဖန်တီးခြင်း
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

    // ⭐ Branch DB အတွက် နမူနာ ဒေတာများဖန်တီးခြင်း
    const Order = getOrderModel(branchDb);
    const Employee = getBranchEmployeeModel(branchDb);

    // နမူနာ အော်ဒါတစ်ခုဖန်တီးခြင်း
    await Order.create({
      orderNumber: `ORD-${code}-001`,
      customerName: "Test Customer",
      items: [],
      totalAmount: 0,
      status: "pending",
    });

    // နမူနာ ဝန်ထမ်းတစ်ဦးဖန်တီးခြင်း
    await Employee.create({
      name: assignedManager,
      email: email || `manager@${code.toLowerCase()}.com`,
      phone: phone || "09-000000000",
      position: "Manager",
      salary: 0,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: newBranch,
    });
  } catch (error: any) {
    console.error("Create branch error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getBranches = async (req: Request, res: Response) => {
  try {
    const Branch = getCentralBranchModel();
    const { status, search } = req.query;

    const filter: any = {};
    if (status && status !== "All") {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { manager: { $regex: search, $options: "i" } },
      ];
    }

    const branches = await Branch.find(filter).sort({ createdAt: -1 });

    // ⭐ Branch တစ်ခုချင်းစီရဲ့ စာရင်းအင်းများကိုဆွဲယူခြင်း
    const branchesWithStats = await Promise.all(
      branches.map(async (branch) => {
        const stats = await getBranchStatsFromDB(branch);
        return {
          ...branch.toObject(),
          employeeCount: stats.employeeCount,
          revenue: stats.revenue,
          totalOrders: stats.totalOrders,
          lastUpdated: new Date(),
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: branchesWithStats,
    });
  } catch (error: any) {
    console.error("Get branches error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

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

    const stats = await getBranchStatsFromDB(branch);

    return res.status(200).json({
      success: true,
      data: {
        ...branch.toObject(),
        employeeCount: stats.employeeCount,
        revenue: stats.revenue,
        totalOrders: stats.totalOrders,
      },
    });
  } catch (error: any) {
    console.error("Get branch by ID error:", error);
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
      { new: true, runValidators: true },
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
    console.error("Update branch error:", error);
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

    const branch = await Branch.findById(id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const CentralUser = getCentralUserModel();
    const employeeCount = await CentralUser.countDocuments({
      branch: branch.name,
      role: { $in: ["admin", "manager", "cashier"] },
    });

    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete branch with ${employeeCount} employees. Please reassign or delete employees first.`,
      });
    }

    await Branch.findByIdAndDelete(id);

    try {
      const branchDb = getBranchConnection(branch.dbName);

      await branchDb.dropDatabase();
      console.log(`✅ Dropped branch database: ${branch.dbName}`);
    } catch (dbError) {
      console.error(
        `Error dropping branch database ${branch.dbName}:`,
        dbError,
      );
    }

    return res.status(200).json({
      success: true,
      message: "Branch deleted successfully",
      data: {
        branchName: branch.name,
        dbName: branch.dbName,
      },
    });
  } catch (error: any) {
    console.error("Delete branch error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getBranchStats = async (req: Request, res: Response) => {
  try {
    const Branch = getCentralBranchModel();

    const [total, active, inactive, branches] = await Promise.all([
      Branch.countDocuments(),
      Branch.countDocuments({ status: "active" }),
      Branch.countDocuments({ status: "inactive" }),
      Branch.find().select("name code status manager"),
    ]);

    const branchesWithEmployees = await Promise.all(
      branches.map(async (branch) => {
        const stats = await getBranchStatsFromDB(branch);
        return {
          name: branch.name,
          code: branch.code,
          status: branch.status,
          manager: branch.manager,
          employeeCount: stats.employeeCount,
          revenue: stats.revenue,
          totalOrders: stats.totalOrders,
        };
      }),
    );

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
    console.error("Get branch stats error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Update branch stats from branch DB
export const updateBranchStats = async (req: Request, res: Response) => {
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

    const branchDb = getBranchConnection(branch.dbName);
    const BranchEmployee = getBranchEmployeeModel(branchDb);

    // Get employee count (excluding "Not Assigned")
    const employeeCount = await BranchEmployee.countDocuments({
      status: "active",
      name: { $ne: "Not Assigned" },
      isActive: true,
    });

    // Update branch with employee count
    await Branch.findByIdAndUpdate(id, {
      employeeCount,
      lastUpdated: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Branch stats updated successfully",
      data: { employeeCount },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getBranchesForDropdown = async (req: Request, res: Response) => {
  try {
    const Branch = getCentralBranchModel();
    const branches = await Branch.find({ status: "active" })
      .select("name code status")
      .sort({ name: 1 });

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
