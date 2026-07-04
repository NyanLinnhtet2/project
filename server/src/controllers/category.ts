import { Request, Response } from "express";
import { getCentralCategoryModel } from "../models/CentralDB/category";

export const createCategory = async (req: Request, res: Response) => {
  try {
    const Category = getCentralCategoryModel();
    const { name, description } = req.body;

    const categoryName = name.trim();

    if (!categoryName) {
      res.status(400).json({
        success: false,
        message: "Category name is required",
      });
      return;
    }

    const existingCategory = await Category.findOne(categoryName);

    if (existingCategory) {
      res.status(409).json({
        success: false,
        message: "Category already exists",
      });
      return;
    }

    const category = await Category.create({
      name: name.trim(),
      description,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error,
    });
  }
};

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const Category = getCentralCategoryModel();
    const categories = await Category.find({
      status: "active",
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error,
    });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const Category = getCentralCategoryModel();
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error,
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const Category = getCentralCategoryModel();
    const { name, description } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    const categoryName = name.trim();

    if (name) {
      const duplicate = await Category.findOne({
        categoryName,
      });

      if (duplicate) {
        res.status(409).json({
          success: false,
          message: "Category name already exists",
        });
        return;
      }

      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description;
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error,
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const Category = getCentralCategoryModel();
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    category.status = "inactive";

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error,
    });
  }
};
