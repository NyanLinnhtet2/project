import { Request, Response } from "express";
import { getCentralCategoryModel } from "../models/CentralDB/category";
import { getCentralProductModel } from "../models/CentralDB/products";

export const getCategories = async (req: Request, res: Response) => {
  try {
    const Category = getCentralCategoryModel();
    const { status, search } = req.query;

    const filter: any = {};
    if (status && status !== "All") filter.status = status;
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const categories = await Category.find(filter).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error("Get categories error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const Category = getCentralCategoryModel();

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    console.error("Get category by ID error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const Category = getCentralCategoryModel();

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const newCategory = await Category.create({
      name: name.trim(),
      description: description || "",
      status: status || "active",
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }
    console.error("Create category error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const Category = getCentralCategoryModel();

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if name is being changed and already exists
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name: name.trim() });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Category name already exists",
        });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category name already exists",
      });
    }
    console.error("Update category error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const Category = getCentralCategoryModel();

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if category is being used by products
    const Product = getCentralProductModel();
    const productCount = await Product.countDocuments({
      category: category.name,
    });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is used by ${productCount} product(s).`,
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete category error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getCategoryStats = async (req: Request, res: Response) => {
  try {
    const Category = getCentralCategoryModel();

    const [total, active, inactive] = await Promise.all([
      Category.countDocuments(),
      Category.countDocuments({ status: "active" }),
      Category.countDocuments({ status: "inactive" }),
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
    console.error("Get category stats error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getCategoriesWithCount = async (req: Request, res: Response) => {
  try {
    const Category = getCentralCategoryModel();
    const Product = getCentralProductModel();
    const { status, search } = req.query;

    const filter: any = {};
    if (status && status !== "All") filter.status = status;
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const categories = await Category.find(filter).sort({ name: 1 });

    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({
          category: category.name,
        });
        return {
          ...category.toObject(),
          productCount,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: categoriesWithCount,
    });
  } catch (error: any) {
    console.error("Get categories with count error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
