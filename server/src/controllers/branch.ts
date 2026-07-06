import { Request, Response } from "express";
import mongoose from "mongoose";
import { getCentralBranchModel } from "../models/CentralDB/branches"; // Central Branch Model ကို ခေါ်ယူပါ
import { getBranchConnection } from "../db/db";

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

    const newBranch = await Branch.create({
      name,
      code,
      address,
      phone,
      email,
      manager,
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
