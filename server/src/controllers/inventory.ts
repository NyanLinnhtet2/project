import { Request, Response } from "express";
import { getCentralProductModel } from "../models/CentralDB/products";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { getBranchConnection } from "../db/db";
import { getStockModel } from "../models/BranchDB/stock";
import { getStockTransactionModel } from "../models/BranchDB/stockTransaction";


export const getInventory = async (req: Request, res: Response) => {
  try {
    const { branch, search } = req.query;
    const Branch = getCentralBranchModel();
    const Product = getCentralProductModel();

    const branches = await Branch.find({ status: "active" });
    const productMap = new Map();

    for (const branchDoc of branches) {
      if (!branchDoc) continue;

      const branchDb = getBranchConnection(branchDoc.dbName);
      const Stock = getStockModel(branchDb);

      const query: any = {};
      if (search) {
        query.$or = [
          { productName: { $regex: search, $options: "i" } },
          { productSku: { $regex: search, $options: "i" } },
        ];
      }

      const stocks = await Stock.find(query);

      for (const stock of stocks) {
        if (!stock) continue;

        const product = await Product.findById(stock.productId);
        if (!product) continue;

        const key = stock.productId;
        if (!productMap.has(key)) {
          productMap.set(key, {
            productId: stock.productId,
            productSku: stock.productSku,
            productName: stock.productName,
            price: product.price,
            unit: stock.unit || product.unit,
            variants: stock.variants || [],
            branchStocks: [],
            totalStock: 0,
          });
        }

        const item = productMap.get(key);
        item.branchStocks.push({
          branch: stock.branch,
          quantity: stock.quantity,
        });
        item.totalStock += stock.quantity;
      }
    }

    let inventory = Array.from(productMap.values());

    if (branch && branch !== "All") {
      inventory = inventory.filter((item) =>
        item.branchStocks.some((bs: any) => bs.branch === branch)
      );
    }

    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error: any) {
    console.error("Get inventory error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// ============================================================
// ၂။ ဆိုင်ခွဲတစ်ခုရဲ့ Inventory ကိုဆွဲယူခြင်း
// ============================================================
export const getInventoryByBranch = async (req: Request, res: Response) => {
  try {
    const { branchName } = req.params;

    if (!branchName || typeof branchName !== "string") {
      return res.status(400).json({
        success: false,
        message: "Branch name is required",
      });
    }

    const Branch = getCentralBranchModel();
    const Product = getCentralProductModel();

    const branch = await Branch.findOne({ name: branchName });
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const branchDb = getBranchConnection(branch.dbName);
    const Stock = getStockModel(branchDb);

    const stocks = await Stock.find();
    const inventory: any[] = [];

    for (const stock of stocks) {
      if (!stock) continue;

      const product = await Product.findById(stock.productId);
      if (product) {
        inventory.push({
          _id: stock._id,
          productId: stock.productId,
          productSku: stock.productSku,
          productName: stock.productName,
          branch: stock.branch,
          quantity: stock.quantity,
          unit: stock.unit || product.unit,
          variants: stock.variants || [],
          lastUpdated: stock.lastUpdated || stock.updatedAt,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error: any) {
    console.error("Get inventory by branch error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// ============================================================
// ၃။ Stock ထည့်ခြင်း
// ============================================================
export const addStock = async (req: Request, res: Response) => {
  try {
    const { productId, quantity, branch, note, supplier } = req.body;

    // Validate
    if (!productId || !branch || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product ID, branch, and quantity (greater than 0) are required",
      });
    }

    // Check product
    const Product = getCentralProductModel();
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check branch
    const Branch = getCentralBranchModel();
    const branchDoc = await Branch.findOne({ name: branch });
    if (!branchDoc) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const branchDb = getBranchConnection(branchDoc.dbName);
    const Stock = getStockModel(branchDb);
    const Transaction = getStockTransactionModel(branchDb);

    // Get or create stock
    let stock = await Stock.findOne({ productId });
    let oldQuantity = 0;

    if (!stock) {
      stock = new Stock({
        productId: productId,
        productSku: product.sku,
        productName: product.name,
        branch: branch,
        quantity: 0,
        unit: product.unit,
        variants: [],
      });
      await stock.save();
    }

    oldQuantity = stock.quantity;
    stock.quantity += quantity;
    stock.lastUpdated = new Date();
    await stock.save();

    // Create transaction record
    await Transaction.create({
      productId: productId,
      productName: product.name,
      sku: product.sku,
      branch: branch,
      type: "received",
      quantity: quantity,
      previousQuantity: oldQuantity,
      newQuantity: stock.quantity,
      note: note || `Stock received from ${supplier || 'supplier'}`,
      supplier: supplier || undefined,
      createdBy: req.user?.id || "system",
    });

    return res.status(200).json({
      success: true,
      message: "Stock added successfully",
      data: stock,
    });
  } catch (error: any) {
    console.error("Add stock error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const updateStock = async (req: Request, res: Response) => {
  try {
    const { productId, quantity, branch, note } = req.body;

    if (!productId || quantity === undefined || !branch) {
      return res.status(400).json({
        success: false,
        message: "Product ID, quantity, and branch are required",
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative",
      });
    }

    const Branch = getCentralBranchModel();
    const branchDoc = await Branch.findOne({ name: branch });
    if (!branchDoc) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const branchDb = getBranchConnection(branchDoc.dbName);
    const Stock = getStockModel(branchDb);
    const Transaction = getStockTransactionModel(branchDb);

    let stock = await Stock.findOne({ productId });
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock not found for this product in the specified branch",
      });
    }

    const oldQuantity = stock.quantity;
    stock.quantity = quantity;
    stock.lastUpdated = new Date();
    await stock.save();

    await Transaction.create({
      productId: productId,
      productName: stock.productName,
      sku: stock.productSku,
      branch: branch,
      type: "adjustment",
      quantity: quantity - oldQuantity,
      previousQuantity: oldQuantity,
      newQuantity: stock.quantity,
      note: note || "Stock adjusted",
      createdBy: req.user?.id || "system",
    });

    return res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: stock,
    });
  } catch (error: any) {
    console.error("Update stock error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// ============================================================
// ၅။ Stock လွှဲပြောင်းခြင်း
// ============================================================
export const transferStock = async (req: Request, res: Response) => {
  try {
    const { productId, fromBranch, toBranch, quantity, note } = req.body;

    if (!productId || !fromBranch || !toBranch || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID, fromBranch, toBranch, and quantity are required",
      });
    }

    if (fromBranch === toBranch) {
      return res.status(400).json({
        success: false,
        message: "Source and destination branches must be different",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const Product = getCentralProductModel();
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const Branch = getCentralBranchModel();

    // Source branch
    const fromBranchDoc = await Branch.findOne({ name: fromBranch });
    if (!fromBranchDoc) {
      return res.status(404).json({
        success: false,
        message: "Source branch not found",
      });
    }

    const fromBranchDb = getBranchConnection(fromBranchDoc.dbName);
    const FromStock = getStockModel(fromBranchDb);
    const FromTransaction = getStockTransactionModel(fromBranchDb);

    const fromStock = await FromStock.findOne({ productId });
    if (!fromStock) {
      return res.status(404).json({
        success: false,
        message: "Product not found in source branch",
      });
    }

    if (fromStock.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${fromStock.quantity}`,
      });
    }

    const oldFromQuantity = fromStock.quantity;
    fromStock.quantity -= quantity;
    fromStock.lastUpdated = new Date();
    await fromStock.save();

    await FromTransaction.create({
      productId: productId,
      productName: product.name,
      sku: product.sku,
      branch: fromBranch,
      type: "transfer",
      quantity: -quantity,
      previousQuantity: oldFromQuantity,
      newQuantity: fromStock.quantity,
      note: note || `Transferred to ${toBranch}`,
      createdBy: req.user?.id || "system",
    });

    // Destination branch
    const toBranchDoc = await Branch.findOne({ name: toBranch });
    if (!toBranchDoc) {
      return res.status(404).json({
        success: false,
        message: "Destination branch not found",
      });
    }

    const toBranchDb = getBranchConnection(toBranchDoc.dbName);
    const ToStock = getStockModel(toBranchDb);
    const ToTransaction = getStockTransactionModel(toBranchDb);

    let toStock = await ToStock.findOne({ productId });

    if (!toStock) {
      toStock = new ToStock({
        productId: productId,
        productSku: product.sku,
        productName: product.name,
        branch: toBranch,
        quantity: 0,
        unit: product.unit,
        variants: [],
      });
    }

    const oldToQuantity = toStock.quantity;
    toStock.quantity += quantity;
    toStock.lastUpdated = new Date();
    await toStock.save();

    await ToTransaction.create({
      productId: productId,
      productName: product.name,
      sku: product.sku,
      branch: toBranch,
      type: "received",
      quantity: quantity,
      previousQuantity: oldToQuantity,
      newQuantity: toStock.quantity,
      note: note || `Received from ${fromBranch}`,
      createdBy: req.user?.id || "system",
    });

    return res.status(200).json({
      success: true,
      message: "Stock transferred successfully",
      data: { fromBranch: fromStock, toBranch: toStock },
    });
  } catch (error: any) {
    console.error("Transfer stock error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// ============================================================
// ၆။ Inventory Stats ဆွဲယူခြင်း
// ============================================================
export const getInventoryStats = async (req: Request, res: Response) => {
  try {
    const Branch = getCentralBranchModel();
    const Product = getCentralProductModel();
    const branches = await Branch.find({ status: "active" });

    let totalProducts = 0;
    let totalStockValue = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;
    const branchStats: any[] = [];

    for (const branch of branches) {
      if (!branch) continue;

      const branchDb = getBranchConnection(branch.dbName);
      const Stock = getStockModel(branchDb);
      const stocks = await Stock.find();

      let branchTotal = 0;
      let branchProducts = 0;
      let branchValue = 0;

      for (const stock of stocks) {
        if (!stock) continue;

        const product = await Product.findById(stock.productId);
        if (product) {
          branchTotal += stock.quantity;
          branchProducts++;
          totalProducts++;
          const value = stock.quantity * product.price;
          totalStockValue += value;
          branchValue += value;

          if (stock.quantity === 0) {
            outOfStockItems++;
          } else if (stock.quantity <= 10) {
            lowStockItems++;
          }
        }
      }

      branchStats.push({
        name: branch.name,
        productCount: branchProducts,
        totalQuantity: branchTotal,
        totalValue: branchValue,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalStockValue,
        lowStockItems,
        outOfStockItems,
        branches: branchStats,
      },
    });
  } catch (error: any) {
    console.error("Get inventory stats error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// ============================================================
// ၇။ Stock Transaction History ဆွဲယူခြင်း
// ============================================================
export const getStockTransactions = async (req: Request, res: Response) => {
  try {
    const { productId, branch, type, limit = 100 } = req.query;

    const Branch = getCentralBranchModel();
    const branches = await Branch.find({ status: "active" });

    let allTransactions: any[] = [];

    for (const branchDoc of branches) {
      if (!branchDoc) continue;

      if (branch && branch !== "All" && branchDoc.name !== branch) continue;

      const branchDb = getBranchConnection(branchDoc.dbName);
      const Transaction = getStockTransactionModel(branchDb);

      const query: any = {};

      if (productId && typeof productId === "string") {
        query.productId = productId;
      }

      if (type && typeof type === "string" && type !== "All") {
        query.type = type;
      }

      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit));

      allTransactions = [...allTransactions, ...transactions];
    }

    allTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (allTransactions.length > Number(limit)) {
      allTransactions = allTransactions.slice(0, Number(limit));
    }

    return res.status(200).json({
      success: true,
      data: allTransactions,
    });
  } catch (error: any) {
    console.error("Get stock transactions error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// ============================================================
// ၈။ Low Stock Items ဆွဲယူခြင်း
// ============================================================
export const getLowStockItems = async (req: Request, res: Response) => {
  try {
    const { threshold = 10 } = req.query;
    const Branch = getCentralBranchModel();
    const branches = await Branch.find({ status: "active" });

    const lowStockItems: any[] = [];

    for (const branch of branches) {
      if (!branch) continue;

      const branchDb = getBranchConnection(branch.dbName);
      const Stock = getStockModel(branchDb);
      const stocks = await Stock.find({
        quantity: { $lte: Number(threshold) },
      });

      for (const stock of stocks) {
        if (!stock) continue;

        lowStockItems.push({
          productId: stock.productId,
          productName: stock.productName,
          productSku: stock.productSku,
          branch: stock.branch,
          quantity: stock.quantity,
          unit: stock.unit,
          variants: stock.variants || [],
          lastUpdated: stock.lastUpdated,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: lowStockItems,
    });
  } catch (error: any) {
    console.error("Get low stock items error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};