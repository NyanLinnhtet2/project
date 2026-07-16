import { Request, Response } from "express";
import { getCentralProductModel } from "../models/CentralDB/products";
import { uploadSingleImage, deleteImage } from "../utils/cloudinary";

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Get all products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const Product = getCentralProductModel();
    const { status, category, search } = req.query;

    const filter: any = {};
    if (status && status !== "All") filter.status = status;
    if (category && category !== "All") filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error("Get products error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if id exists and is a string
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Validate if the ID is a valid MongoDB ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
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

    return res.status(200).json({
      success: true,
      data: product,
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
      unit,
      status,
      description,
      shopName,
      avatar,
      variants,
    } = req.body;

    // Validate required fields
    if (!name || !sku || !category || !brand || !price) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    const Product = getCentralProductModel();

    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists",
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
      shopName: shopName || "",
      variants: variants || [],
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct,
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

    // Check if id exists and is a string
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Validate if the ID is a valid MongoDB ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    const {
      name,
      sku,
      category,
      brand,
      price,
      cost,
      unit,
      status,
      description,
      shopName,
      avatar,
      variants,
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

    // Check if SKU is being changed and already exists
    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({
        sku: sku,
        _id: { $ne: id },
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
      name: name || product.name,
      sku: sku || product.sku,
      category: category || product.category,
      brand: brand || product.brand,
      price: price !== undefined ? Number(price) : product.price,
      cost: cost !== undefined ? Number(cost) : product.cost,
      unit: unit || product.unit,
      status: status || product.status,
      image,
      description: description !== undefined ? description : product.description,
      shopName: shopName !== undefined ? shopName : product.shopName,
      variants: variants !== undefined ? variants : product.variants,
    };

    // Update product in Central DB
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
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

    // Check if id exists and is a string
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Validate if the ID is a valid MongoDB ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
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

    // Delete image from Cloudinary
    if (product.image?.public_id) {
      await deleteImage(product.image.public_id);
    }

    // Delete product from Central DB
    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete product error:", error);
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

    const [total, active, inactive] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: "active" }),
      Product.countDocuments({ status: "inactive" }),
    ]);

    // Calculate total value (sum of all product prices)
    const allProducts = await Product.find();
    const totalValue = allProducts.reduce((sum, product) => sum + product.price, 0);

    return res.status(200).json({
      success: true,
      data: {
        total,
        active,
        inactive,
        totalValue,
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