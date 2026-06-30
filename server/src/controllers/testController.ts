import { getCentralOrderModel } from "../models/CentralDB/order";
import { getYGBranchSaleModel } from "../models/YGNBranchDB/stock";
import { Response, Request } from "express";

export const seedBranchStock = async (req: Request, res: Response) => {
  try {
    const YGStock = getYGBranchSaleModel();

    await YGStock.deleteMany({});

    const sampleStock = await YGStock.create({
      productName: "T-Shirt XL",
      availableStock: 100,
    });

    res.status(201).json({
      message: "YG Branch stock ထည့်ပြီးပါပြီ",
      sampleStock,
    });
  } catch (error) {
    console.log("Seed Branch Error:", error);

    res.status(500).json({ error });
  }
};

export const createOrderWorkflowTest = async (req: Request, res: Response) => {
  try {
    const { productName, quantity, totalPrice } = req.body;

    const YGStock = getYGBranchSaleModel();

    // 1️⃣ Find stock
    const stockItem = await YGStock.findOne({ productName });

    if (!stockItem) {
      return res.status(404).json({
        message: "Product မတွေ့ပါ",
      });
    }

    if (!stockItem.availableStock || stockItem.availableStock < quantity) {
      return res.status(400).json({
        message: "Stock မလုံလောက်ပါ",
      });
    }

    // 2️⃣ Reduce stock (YG Branch DB)
    stockItem.availableStock -= quantity;
    stockItem.lastUpdated = new Date();
    await stockItem.save();

    // 3️⃣ Create order (Central DB)
    const CentralOrder = getCentralOrderModel();

    const newOrder = await CentralOrder.create({
      productName,
      quantity,
      totalPrice,
      branchName: "Yangon",
    });

    // 4️⃣ Response
    return res.status(200).json({
      message: "Workflow success (2 DB updated)",
      branchDB_UpdatedStock: stockItem,
      centralDB_SavedOrder: newOrder,
    });
  } catch (error) {
    console.log("Order Workflow Error:", error);

    res.status(500).json({
      message: "Server Error",
      error,
    });
  }
};
