import { Request, Response } from "express";
import { getCentralBrandModel } from "../models/CentralDB/brand";

export const createBrand = async (req: Request, res: Response) => {
  try {
    const Brand = getCentralBrandModel();

    const { name, description } = req.body;

    const existingBrand = await Brand.findOne({ name });

    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: "Brand already exists",
      });
    }

    const brand = await Brand.create({
      name,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Brand created successfully",
      data: brand,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAllBrands = async (req: Request, res: Response) => {
  try {
    const Brand = getCentralBrandModel();

    const brands = await Brand.find();

    return res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getBrandById = async (req: Request, res: Response) => {
  try {
    const Brand = getCentralBrandModel();

    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateBrand = async (req: Request, res: Response) => {
  try {
    const Brand = getCentralBrandModel();

    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      data: brand,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const deleteBrand = async (req: Request, res: Response) => {
  try {
    const Brand = getCentralBrandModel();

    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      {
        status: "inactive",
      },
      {
        new: true,
      },
    );

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
