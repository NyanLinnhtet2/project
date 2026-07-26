import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  getProductStockAcrossBranchesApi,
  getProductsForTransferApi,
  createTransferRequestApi,
} from "../../services/transferService";
import type { Product } from "../../types/product";
import type { BranchStockInfo } from "../../types/transfer";
import { useAuth } from "../../context/useAuth";
import axios from "axios";
import type { ErrorResponse } from "../../types/ErrorResponse";
import {
  Package,
  Store,
  RefreshCw,
  AlertCircle,
  Loader2,
  Truck,
} from "lucide-react";

export const TransferStock = () => {
  const { userInfo } = useAuth();

  const currentBranchName = userInfo?.branch || "";
  const username = userInfo?.name || "Manager";

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const [stocks, setStocks] = useState<BranchStockInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedSourceBranchName, setSelectedSourceBranchName] =
    useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [maxAvailable, setMaxAvailable] = useState<number>(0);

  const fetchProducts = async () => {
    try {
      const res = await getProductsForTransferApi(currentBranchName);
      if (res.success) setProducts(res.data);
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;
      toast.error(message ?? "Failed to load products");
    }
  };

  useEffect(() => {
    if (!currentBranchName) return;
    const t = setTimeout(fetchProducts, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBranchName]);

  const fetchStocks = async (productId: string) => {
    setLoading(true);
    try {
      const res = await getProductStockAcrossBranchesApi(productId);
      if (res.success) {
        const otherBranches = res.data.filter(
          (b) => b.branchName !== currentBranchName,
        );
        setStocks(otherBranches);
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load stock data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedProductId) return;
    const t = setTimeout(() => fetchStocks(selectedProductId), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId]);

  const handleBranchChange = (branchName: string) => {
    setSelectedSourceBranchName(branchName);
    const selected = stocks.find((s) => s.branchName === branchName);
    setMaxAvailable(selected ? selected.quantity : 0);
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetId = e.target.value;
    setSelectedProductId(targetId);
    if (!targetId) {
      setStocks([]);
      setSelectedSourceBranchName("");
      setQuantity(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSourceBranchName || quantity <= 0) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }
    if (quantity > maxAvailable) {
      toast.error(
        `Requested quantity exceeds available stock (${maxAvailable} pcs).`,
      );
      return;
    }

    try {
      const res = await createTransferRequestApi({
        fromBranch: selectedSourceBranchName,
        toBranch: currentBranchName,
        productId: selectedProductId,
        quantity,
        requestedBy: username,
      });

      if (res.success) {
        toast.success(res.message || "Transfer request sent successfully!");
        setSelectedProductId("");
        setSelectedSourceBranchName("");
        setQuantity(0);
        setStocks([]);
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to send request");
    }
  };

  // Determine selected product name for display
  const selectedProduct = products.find((p) => p._id === selectedProductId);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
                <Truck size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Stock Transfer Request
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Request stock from other branches to {currentBranchName}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (selectedProductId) fetchStocks(selectedProductId);
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:shadow-md disabled:opacity-60"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Main Form Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Selection */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Select Product <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
                value={selectedProductId}
                onChange={handleProductChange}
              >
                <option value="">-- Choose a Product --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (SKU: {p.sku})
                  </option>
                ))}
              </select>
              {products.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No products available for transfer.
                </p>
              )}
            </div>

            {/* Stock Availability Table */}
            {selectedProductId && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Available Stock in Other Branches
                </label>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-slate-500">
                      Loading stock data...
                    </span>
                  </div>
                ) : stocks.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-amber-700 border border-amber-200">
                    <AlertCircle size={18} />
                    <span className="text-sm">
                      This product is not available in any other branch.
                    </span>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200/50">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Branch
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Available Stock
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {stocks.map((s) => (
                            <tr
                              key={s.branchName}
                              className={`cursor-pointer transition hover:bg-blue-50/50 ${
                                selectedSourceBranchName === s.branchName
                                  ? "bg-blue-50 border-l-4 border-blue-600"
                                  : ""
                              }`}
                              onClick={() => handleBranchChange(s.branchName)}
                            >
                              <td className="px-4 py-3 flex items-center gap-2">
                                <Store size={16} className="text-slate-400" />
                                <span className="font-medium text-slate-700">
                                  {s.branchName}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-blue-600">
                                {s.quantity} pcs
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Input & Submit */}
            {selectedSourceBranchName && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Transfer Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={maxAvailable}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Maximum requestable:{" "}
                    <span className="font-semibold">{maxAvailable}</span> pcs
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductId("");
                      setSelectedSourceBranchName("");
                      setQuantity(0);
                      setStocks([]);
                    }}
                    className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 py-3 font-medium text-white shadow-lg shadow-blue-200 transition hover:scale-105 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
                  >
                    Send Request
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Product Info Card (if selected) */}
        {selectedProduct && selectedSourceBranchName && (
          <div className="rounded-2xl bg-blue-50/50 p-4 border border-blue-200/50">
            <div className="flex items-center gap-2 text-blue-700">
              <Package size={18} />
              <span className="font-medium">Transfer Summary:</span>
              <span>
                {selectedProduct.name} ({selectedProduct.sku})
              </span>
              <span className="text-slate-500">→</span>
              <span className="font-medium">{quantity} pcs</span>
              <span className="text-slate-500">from</span>
              <span className="font-medium">{selectedSourceBranchName}</span>
              <span className="text-slate-500">to</span>
              <span className="font-medium">{currentBranchName}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
