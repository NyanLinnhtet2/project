import { Request, Response } from "express";
import { getCentralBrandModel } from "../models/CentralDB/brand";
import { getCentralProductModel } from "../models/CentralDB/products";

export const getBrands = async (req: Request, res: Response) => {
  try {
    const Brand = getCentralBrandModel();
    const { status, search } = req.query;

    const filter: any = {};
    if (status && status !== "All") filter.status = status;
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const brands = await Brand.find(filter).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error: any) {
    console.error("Get brands error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getBrandById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const Brand = getCentralBrandModel();

    const brand = await Brand.findById(id);
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
  } catch (error: any) {
    console.error("Get brand by ID error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const createBrand = async (req: Request, res: Response) => {
  try {
    const { name, description, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required",
      });
    }

    const Brand = getCentralBrandModel();

    const existingBrand = await Brand.findOne({ name });
    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: "Brand already exists",
      });
    }

    const newBrand = await Brand.create({
      name: name.trim(),
      description: description || "",
      status: status || "active",
    });

    return res.status(201).json({
      success: true,
      message: "Brand created successfully",
      data: newBrand,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Brand already exists",
      });
    }
    console.error("Create brand error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const updateBrand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const Brand = getCentralBrandModel();

    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    if (name && name !== brand.name) {
      const existingBrand = await Brand.findOne({ name: name.trim() });
      if (existingBrand) {
        return res.status(400).json({
          success: false,
          message: "Brand name already exists",
        });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    const updatedBrand = await Brand.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      data: updatedBrand,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Brand name already exists",
      });
    }
    console.error("Update brand error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const deleteBrand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const Brand = getCentralBrandModel();

    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    const Product = getCentralProductModel();
    const productCount = await Product.countDocuments({ brand: brand.name });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete brand. It is used by ${productCount} product(s).`,
      });
    }

    await Brand.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete brand error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getBrandStats = async (req: Request, res: Response) => {
  try {
    const Brand = getCentralBrandModel();

    const [total, active, inactive] = await Promise.all([
      Brand.countDocuments(),
      Brand.countDocuments({ status: "active" }),
      Brand.countDocuments({ status: "inactive" }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        active,
        inactive,
      },
    });
  } catch (error: any) {
    console.error("Get brand stats error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getBrandsWithCount = async (req: Request, res: Response) => {
  try {
    const Brand = getCentralBrandModel();
    const Product = getCentralProductModel();
    const { status, search } = req.query;

    const filter: any = {};
    if (status && status !== "All") filter.status = status;
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const brands = await Brand.find(filter).sort({ name: 1 });

    
    const brandsWithCount = await Promise.all(
      brands.map(async (brand) => {
        const productCount = await Product.countDocuments({ 
          brand: brand.name 
        });
        return {
          ...brand.toObject(),
          productCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: brandsWithCount,
    });
  } catch (error: any) {
    console.error("Get brands with count error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};