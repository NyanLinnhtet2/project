import { Request, Response } from "express";
import { getCentralBranchModel } from "../models/CentralDB/branches";

export const createBranch = async (req: Request, res: Response) => {
  try {
    const Branch = getCentralBranchModel();

    const { name, code, address, phone, manager } = req.body;

    const existingBranch = await Branch.findOne({ code });

    if (existingBranch) {
      res.status(400).json({
        success: false,
        message: "Branch code already exists",
      });
      return;
    }

    const newBranch = await Branch.create({
      name,
      code,
      address,
      phone,
      manager,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: newBranch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error,
    });
  }
};

export const getAllBranches = async (req: Request, res: Response) => {
  try {
    const Branch = getCentralBranchModel();

    const branches = await Branch.find();

    res.status(200).json({
      success: true,
      data: branches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const updateBranch = async (req: Request, res: Response) => {
  try {
    const Branch = getCentralBranchModel();

    const { id } = req.params;

    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true },
    );

    if (!updatedBranch) {
      res.status(404).json({
        success: false,
        message: "Branch not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      data: updatedBranch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const Branch = getCentralBranchModel();

    const { id } = req.params;

    const deleted = await Branch.findByIdAndUpdate(
      id,
      { status: "inactive" },
      { new: true },
    );

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Branch not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Branch deleted (inactive) successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
