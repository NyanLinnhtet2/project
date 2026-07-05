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

    // 🌟 ၁။ Branch Database အမည်ကို အလိုအလျောက် သတ်မှတ်ခြင်း 🌟
    // ဥပမာ - Code က "MDY" ဆိုရင် Database နာမည်က "branch_mdy" ဖြစ်သွားပါမည်
    const branchDbName = `branch_${code.toLowerCase()}`;

    // ၂။ Central DB ထဲတွင် Branch အသစ်ကို အရင်သိမ်းပါမည်
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

    // 🌟 ၃။ Branch Database အသစ်ကို ဖန်တီးခြင်း (Auto Create DB) 🌟
    const branchDb = getBranchConnection(branchDbName);

    // MongoDB သည် Collection ထဲသို့ Data စဝင်မှသာ Database ကို တကယ်ဆောက်ပေးမည်ဖြစ်၍
    // System Config ကဲ့သို့ Dummy Collection တစ်ခုဖန်တီးပြီး Data စထည့်ပါမည်
    const ConfigSchema = new mongoose.Schema({
      branchId: String,
      initializedAt: { type: Date, default: Date.now },
    });

    const ConfigModel = branchDb.model("SystemConfig", ConfigSchema);

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
