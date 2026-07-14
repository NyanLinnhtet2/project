import { Request, Response } from "express";
import { getCentralProductModel } from "../models/CentralDB/products";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getBranchConnection } from "../db/db";
import { getStockModel } from "../models/BranchDB/stock";
import { uploadSingleImage, deleteImage } from "../utils/cloudinary";

const syncStockToBranch = async (
  branchName: string,
  productData: {
    productId: string;
    productSku: string;
    productName: string;
    quantity: number;
    unit: string;
  },
) => {
  try {
    const Branch = getCentralBranchModel();
    const branch = await Branch.findOne({ name: branchName });

    if (!branch) {
      console.error(`Branch not found: ${branchName}`);
      return;
    }

    const branchDb = getBranchConnection(branch.dbName);
    const Stock = getStockModel(branchDb);

    const existingStock = await Stock.findOne({
      productId: productData.productId,
    });

    if (existingStock) {
      await Stock.findByIdAndUpdate(existingStock._id, {
        quantity: productData.quantity,
        productName: productData.productName,
        unit: productData.unit,
        lastUpdated: new Date(),
      });
      console.log(`✅ Updated stock in branch DB: ${productData.productSku}`);
    } else {
      await Stock.create({
        productId: productData.productId,
        productSku: productData.productSku,
        productName: productData.productName,
        quantity: productData.quantity,
        branch: branchName,
        unit: productData.unit,
      });
      console.log(`✅ Created stock in branch DB: ${productData.productSku}`);
    }
  } catch (error) {
    console.error(`Error syncing stock to branch DB:`, error);
  }
};

// Helper: Delete stock from branch database
const deleteStockFromBranch = async (branchName: string, productId: string) => {
  try {
    const Branch = getCentralBranchModel();
    const branch = await Branch.findOne({ name: branchName });

    if (!branch) {
      console.error(`Branch not found: ${branchName}`);
      return;
    }

    const branchDb = getBranchConnection(branch.dbName);
    const Stock = getStockModel(branchDb);

    await Stock.findOneAndDelete({ productId });
    console.log(`✅ Deleted stock from branch DB: ${productId}`);
  } catch (error) {
    console.error(`Error deleting stock from branch DB:`, error);
  }
};

// Get all products with stock
export const getProducts = async (req: Request, res: Response) => {
  try {
    const Product = getCentralProductModel();
    const { status, category, search, branch } = req.query;

    const filter: any = {};
    if (status && status !== "All") filter.status = status;
    if (category && category !== "All") filter.category = category;
    if (branch) filter.branch = branch;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        const Branch = getCentralBranchModel();
        const branch = await Branch.findOne({ name: product.branch });

        let stock = 0;
        if (branch) {
          const branchDb = getBranchConnection(branch.dbName);
          const Stock = getStockModel(branchDb);
          const stockData = await Stock.findOne({
            productId: product._id.toString(),
          });
          stock = stockData?.quantity || 0;
        }

        return {
          ...product.toObject(),
          stock,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: productsWithStock,
    });
  } catch (error: any) {
    console.error("Get products error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Get product by ID with stock
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const Product = getCentralProductModel();

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Get stock from branch DB
    const Branch = getCentralBranchModel();
    const branch = await Branch.findOne({ name: product.branch });
    let stock = 0;
    if (branch) {
      const branchDb = getBranchConnection(branch.dbName);
      const Stock = getStockModel(branchDb);
      const stockData = await Stock.findOne({
        productId: product._id.toString(),
      });
      stock = stockData?.quantity || 0;
    }

    return res.status(200).json({
      success: true,
      data: {
        ...product.toObject(),
        stock,
      },
    });
  } catch (error: any) {
    console.error("Get product by ID error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Create product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      sku,
      category,
      brand,
      price,
      cost,
      stock,
      unit,
      status,
      description,
      branch,
      shopName,
      avatar,
    } = req.body;

    // Validate required fields
    if (!name || !sku || !category || !brand || !price || !branch) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    const Product = getCentralProductModel();
    const Branch = getCentralBranchModel();

    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists",
      });
    }

    // Check if branch exists
    const branchExists = await Branch.findOne({ name: branch });
    if (!branchExists) {
      return res.status(400).json({
        success: false,
        message: "Branch not found",
      });
    }

    // Handle image upload
    let image = { url: "", public_id: "" };

    if (avatar) {
      try {
        const uploadedImage = await uploadSingleImage(avatar, "products");
        image = {
          url: uploadedImage.image_url,
          public_id: uploadedImage.public_id,
        };
      } catch (error) {
        console.error("Image upload failed:", error);
      }
    }

    // Create product in Central DB
    const newProduct = await Product.create({
      name,
      sku,
      category,
      brand,
      price: Number(price),
      cost: Number(cost) || 0,
      unit: unit || "pcs",
      status: status || "active",
      image,
      description: description || "",
      shopName,
      branch,
    });

    // Sync stock to branch DB
    await syncStockToBranch(branch, {
      productId: newProduct._id.toString(),
      productSku: sku,
      productName: name,
      quantity: Number(stock) || 0,
      unit: unit || "pcs",
    });

    const productResponse = newProduct.toObject();
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: {
        ...productResponse,
        stock: Number(stock) || 0,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists",
      });
    }
    console.error("Create product error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      category,
      brand,
      price,
      cost,
      stock,
      unit,
      status,
      description,
      branch,
      shopName,
      avatar,
    } = req.body;

    const Product = getCentralProductModel();

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ✅ FIXED: Check if SKU is being changed and already exists
    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({
        sku: sku,
        _id: { $ne: id } as any, // Type assertion to fix TypeScript error
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "SKU already exists",
        });
      }
    }

    // Handle image update
    let image = product.image;
    if (avatar) {
      try {
        if (image.public_id) {
          await deleteImage(image.public_id);
        }
        const uploadedImage = await uploadSingleImage(avatar, "products");
        image = {
          url: uploadedImage.image_url,
          public_id: uploadedImage.public_id,
        };
      } catch (error) {
        console.error("Image upload failed:", error);
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      sku,
      category,
      brand,
      price: Number(price),
      cost: Number(cost) || 0,
      unit: unit || "pcs",
      status: status || "active",
      image,
      description: description || "",
      shopName,
      branch,
    };

    // Update product in Central DB
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    // Sync stock to branch DB if stock is provided
    if (stock !== undefined) {
      await syncStockToBranch(branch || product.branch, {
        productId: updatedProduct?._id.toString()!,
        productSku: sku || product.sku,
        productName: name || product.name,
        quantity: Number(stock),
        unit: unit || product.unit,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: {
        ...updatedProduct?.toObject(),
        stock: Number(stock) || 0,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists",
      });
    }
    console.error("Update product error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const Product = getCentralProductModel();

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete image from Cloudinary
    if (product.image?.public_id) {
      await deleteImage(product.image.public_id);
    }

    // Delete stock from branch DB
    await deleteStockFromBranch(product.branch, product._id.toString());

    // Delete product from Central DB
    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully from central and branch databases",
    });
  } catch (error: any) {
    console.error("Delete product error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Update product stock only
export const updateProductStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const Product = getCentralProductModel();

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Update stock in branch DB
    await syncStockToBranch(product.branch, {
      productId: product._id.toString(),
      productSku: product.sku,
      productName: product.name,
      quantity: Number(quantity),
      unit: product.unit,
    });

    return res.status(200).json({
      success: true,
      message: "Product stock updated successfully",
      data: {
        productId: product._id,
        productName: product.name,
        quantity: Number(quantity),
      },
    });
  } catch (error: any) {
    console.error("Update product stock error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Get product stats
export const getProductStats = async (req: Request, res: Response) => {
  try {
    const Product = getCentralProductModel();

    const [total, active, inactive, outOfStock, branches] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: "active" }),
      Product.countDocuments({ status: "inactive" }),
      Product.countDocuments({ status: "out-of-stock" }),
      Product.distinct("branch"),
    ]);

    // Calculate total value
    const allProducts = await Product.find();
    let totalValue = 0;

    for (const product of allProducts) {
      const Branch = getCentralBranchModel();
      const branch = await Branch.findOne({ name: product.branch });
      let stock = 0;
      if (branch) {
        const branchDb = getBranchConnection(branch.dbName);
        const Stock = getStockModel(branchDb);
        const stockData = await Stock.findOne({
          productId: product._id.toString(),
        });
        stock = stockData?.quantity || 0;
      }
      totalValue += product.price * stock;
    }

    return res.status(200).json({
      success: true,
      data: {
        total,
        active,
        inactive,
        outOfStock,
        totalValue,
        branches,
      },
    });
  } catch (error: any) {
    console.error("Get product stats error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
