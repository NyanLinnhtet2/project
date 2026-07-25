import { Connection } from "mongoose";
import { getReturnModel } from "../models/BranchDB/return";
import { ISale } from "../models/BranchDB/sale";

export interface ReturnInfo {
  canReturn: boolean;
  returnType?: "return" | "exchange";
}

export const attachReturnInfo = async (
  sales: (ISale & { toObject: () => any })[],
  branchDb: Connection,
): Promise<(ReturnInfo & Record<string, any>)[]> => {
  if (sales.length === 0) return [];

  const Return = getReturnModel(branchDb);
  const saleIds = sales.map((s) => s._id);
  const returns = await Return.find({ originalSaleId: { $in: saleIds } });

  const returnedQtyBySale = new Map<string, Map<string, number>>();
  const typeBySale = new Map<string, "return" | "exchange">();

  for (const r of returns) {
    const key = r.originalSaleId.toString();
    if (!returnedQtyBySale.has(key)) returnedQtyBySale.set(key, new Map());
    const productMap = returnedQtyBySale.get(key)!;
    for (const item of r.items) {
      const pid = item.productId.toString();
      productMap.set(pid, (productMap.get(pid) || 0) + item.quantity);
    }
    if (r.type === "exchange" || !typeBySale.has(key)) {
      typeBySale.set(
        key,
        r.type === "exchange" ? "exchange" : typeBySale.get(key) || "return",
      );
    }
  }

  return sales.map((sale) => {
    const saleObj = sale.toObject();
    const key = sale._id.toString();
    const productMap = returnedQtyBySale.get(key);

    const canReturn =
      sale.status === "completed" &&
      sale.items.some((item) => {
        const returned = productMap?.get(item.productId.toString()) || 0;
        return returned < item.quantity;
      });

    return {
      ...saleObj,
      canReturn,
      returnType: typeBySale.get(key),
    };
  });
};
