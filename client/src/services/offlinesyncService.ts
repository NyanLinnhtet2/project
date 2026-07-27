import { createSaleApi } from "./saleService";
import { offlineDb, type CachedProduct } from "../db/offlineDb";
import type { Stock } from "../types/inventory";
import type { Product } from "../types/product";
import type { PaymentMethod } from "../types/sale";

interface StockWithProduct extends Stock {
  product?: Product;
}

export const cacheProductsForBranch = async (
  branchId: string,
  stockData: Stock[],
): Promise<void> => {
  const cached: CachedProduct[] = stockData
    .map((stock): CachedProduct | null => {  
      const item = stock as StockWithProduct;
      const product = item.product;
      if (!product) return null;
      return {
        productId: product._id,
        branchId,
        stockId: stock._id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        category: product.category,
        brand: product.brand,
        imageUrl: product.image?.url,
        quantity: stock.quantity,
      };
    })
    .filter((c): c is CachedProduct => c !== null);

  const existing = await offlineDb.products.where("branchId").equals(branchId).toArray();
  await offlineDb.products.bulkDelete(existing.map((p) => p.productId));
  await offlineDb.products.bulkPut(cached);
};

export const getCachedProductsForBranch = async (
  branchId: string,
): Promise<CachedProduct[]> => {
  return offlineDb.products.where("branchId").equals(branchId).toArray();
};

const decrementCachedStock = async (
  items: { productId: string; quantity: number }[],
): Promise<void> => {
  for (const item of items) {
    const row = await offlineDb.products.get(item.productId);
    if (row) {
      await offlineDb.products.put({
        ...row,
        quantity: Math.max(0, row.quantity - item.quantity),
      });
    }
  }
};

const restoreCachedStock = async (
  items: { productId: string; quantity: number }[],
): Promise<void> => {
  for (const item of items) {
    const row = await offlineDb.products.get(item.productId);
    if (row) {
      await offlineDb.products.put({ ...row, quantity: row.quantity + item.quantity });
    }
  }
};

// ============================================================
// Pending sale queue
// ============================================================
export interface QueueSalePayload {
  items: { productId: string; quantity: number }[];
  paymentMethod: string;
  discountType: "amount" | "percent";
  discountValue: number;
  taxRate: number;
}

export const queuePendingSale = async (
  branchId: string,
  payload: QueueSalePayload,
): Promise<void> => {
  // look up names from the cache purely for display in a future pending-sync
  // panel — checkout itself only needs productId + quantity
  const itemsWithNames = await Promise.all(
    payload.items.map(async (item) => {
      const cached = await offlineDb.products.get(item.productId);
      return { ...item, name: cached?.name ?? item.productId };
    }),
  );

  await offlineDb.pendingSales.add({
    branchId,
    items: itemsWithNames,
    paymentMethod: payload.paymentMethod,
    discountType: payload.discountType,
    discountValue: payload.discountValue,
    taxRate: payload.taxRate,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  await decrementCachedStock(payload.items);
};

export const getPendingSaleCount = async (branchId: string): Promise<number> => {
  return offlineDb.pendingSales.where("branchId").equals(branchId).count();
};

// Replays every queued sale through the normal createSale endpoint. The
// server re-validates stock/price/discount cap for real — a queued sale
// can still fail here (e.g. another register sold the last unit while
// this device was offline), in which case it's kept with status "failed"
// for a manager to review rather than silently dropped or retried forever.
export const syncPendingSales = async (
  branchId: string,
): Promise<{ synced: number; failed: number }> => {
  const pending = await offlineDb.pendingSales
    .where("branchId")
    .equals(branchId)
    .toArray();
  const toSync = pending.filter((s) => s.status !== "syncing");

  let synced = 0;
  let failed = 0;

  for (const sale of toSync) {
    if (sale.id === undefined) continue;
    await offlineDb.pendingSales.update(sale.id, { status: "syncing" });
    try {
      const res = await createSaleApi({
        items: sale.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod: sale.paymentMethod as PaymentMethod,
        discountType: sale.discountType,
        discountValue: sale.discountValue,
        taxRate: sale.taxRate,
      });
      if (res.success) {
        await offlineDb.pendingSales.delete(sale.id);
        synced += 1;
      } else {
        throw new Error(res.message || "Sync failed");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err.response?.data?.message ?? "Sync failed — stock or discount may no longer be valid";
      await offlineDb.pendingSales.update(sale.id, { status: "failed", errorMessage: message });
      failed += 1;
    }
  }

  return { synced, failed };
};

// A manager decided a failed sale really can't go through (e.g. item
// permanently out of stock) — give the reserved-in-cache stock back and
// drop it from the queue.
export const discardPendingSale = async (id: number): Promise<void> => {
  const sale = await offlineDb.pendingSales.get(id);
  if (sale) {
    await restoreCachedStock(sale.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
    await offlineDb.pendingSales.delete(id);
  }
};

export const retryPendingSale = async (id: number): Promise<void> => {
  await offlineDb.pendingSales.update(id, { status: "pending", errorMessage: undefined });
};