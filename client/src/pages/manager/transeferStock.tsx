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

export const TransferStock = () => {
  const { userInfo } = useAuth();

  // 🌟 ID သို့မဟုတ် Code အစား Branch Name ကိုသာ အသုံးပြုပါမည်
  // User Type တွင် branch (ဆိုင်ခွဲအမည်) ပါဝင်ရန် လိုအပ်ပါသည်
  const currentBranchName = userInfo?.branch || "";
  const username = userInfo?.name || "Manager";

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const [stocks, setStocks] = useState<BranchStockInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 🌟 တောင်းဆိုမည့် Source ကိုလည်း Branch Name ဖြင့်သာ မှတ်သားပါမည်
  const [selectedSourceBranchName, setSelectedSourceBranchName] =
    useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [maxAvailable, setMaxAvailable] = useState<number>(0);

  // 🌟 Product များ ဆွဲယူခြင်း (မိမိ ဆိုင်ခွဲအမည်ကို ပေးပို့ပါမည်)
  const fetchProducts = async () => {
    try {
      const res = await getProductsForTransferApi(currentBranchName);
      if (res.success) setProducts(res.data);
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;

      toast.error(message ?? "Something went wrong");
    }
  };

  useEffect(() => {
    // Branch Name မရှိပါက API မခေါ်ဘဲ ရပ်ထားပါမည်
    if (!currentBranchName) return;

    const t = setTimeout(() => {
      fetchProducts();
    }, 0);

    return () => clearTimeout(t);
  }, [currentBranchName]);

  // 🌟 ဆိုင်ခွဲများမှ Stock အရေအတွက် ဆွဲယူခြင်း
  const fetchStocks = async (productId: string) => {
    setLoading(true);
    try {
      const res = await getProductStockAcrossBranchesApi(productId);
      if (res.success) {
        // 🌟 Branch Name ဖြင့် တိုက်စစ်ပြီး မိမိဆိုင်ခွဲအမည် မဟုတ်သည်များကိုသာ ပြသပါမည်
        const otherBranches = res.data.filter(
          (b) => b.branchName !== currentBranchName,
        );
        setStocks(otherBranches);
      }
    } catch (error) {
      toast.error(`${(error as { data: { message: string } }).data.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedProductId) return;

    const t = setTimeout(() => {
      fetchStocks(selectedProductId);
    }, 0);

    return () => clearTimeout(t);
  }, [selectedProductId]);

  // 🌟 ဆိုင်ခွဲပြောင်းလဲချိန်တွင် အများဆုံးတောင်းနိုင်သည့် အရေအတွက် သတ်မှတ်ခြင်း
  const handleBranchChange = (branchName: string) => {
    setSelectedSourceBranchName(branchName);
    const selected = stocks.find((s) => s.branchName === branchName);
    setMaxAvailable(selected ? selected.quantity : 0);
  };

  // 🌟 Product ရွေးချယ်မှု ပြောင်းလဲခြင်း
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetId = e.target.value;
    setSelectedProductId(targetId);

    if (!targetId) {
      setStocks([]);
      setSelectedSourceBranchName("");
      setQuantity(0);
    }
  };

  // 🌟 Request ပေးပို့ခြင်း
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSourceBranchName || quantity <= 0) {
      toast.error("ကျေးဇူးပြု၍ အချက်အလက်များကို မှန်ကန်စွာ ဖြည့်သွင်းပါ။");
      return;
    }
    if (quantity > maxAvailable) {
      toast.error(
        "တောင်းဆိုသည့် အရေအတွက်သည် ထိုဆိုင်ခွဲရှိ Stock ထက် ကျော်လွန်နေပါသည်။",
      );
      return;
    }

    try {
      // 🌟 Backend သို့ ID အစား Branch Name များကိုသာ ပေးပို့ပါမည်
      const res = await createTransferRequestApi({
        fromBranch: selectedSourceBranchName,
        toBranch: currentBranchName,
        productId: selectedProductId,
        quantity,
        requestedBy: username,
      });

      if (res.success) {
        toast.success(res.message);
        setSelectedProductId("");
        setSelectedSourceBranchName("");
        setQuantity(0);
      }
    } catch (error) {
      toast.error(`${(error as { data: { message: string } }).data.message}`);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Manager Dashboard - Request Stock Transfer
      </h1>

      <div className="bg-white rounded-lg p-6 shadow-md max-w-2xl">
        <form onSubmit={handleSubmit}>
          {/* Product ရွေးချယ်ရန် Dropdown */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Product to Request
            </label>
            <select
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
          </div>

          {loading && (
            <p className="text-blue-500 text-sm mb-4">
              Loading stock availability...
            </p>
          )}

          {/* Product ရွေးပြီးပါက အခြားဆိုင်ခွဲများ၏ Stock များကို ပြသမည် */}
          {selectedProductId && !loading && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Available Stock in Other Branches
              </label>
              {stocks.length === 0 ? (
                <p className="text-sm text-red-500 bg-red-50 p-3 rounded">
                  အခြား မည်သည့်ဆိုင်ခွဲတွင်မှ ဤပစ္စည်း မရှိပါ။
                </p>
              ) : (
                <div className="border rounded-md overflow-hidden max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Branch</th>
                        <th className="px-4 py-2 text-right">
                          Available Stock
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stocks.map((s) => (
                        <tr
                          key={s.branchName} // 🌟 Branch Name ကိုသာ Key အဖြစ် သုံးပါမည်
                          className={`cursor-pointer hover:bg-blue-50 transition-colors ${selectedSourceBranchName === s.branchName ? "bg-blue-100" : ""}`}
                          onClick={() => handleBranchChange(s.branchName)}
                        >
                          <td className="px-4 py-3">{s.branchName}</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-600">
                            {s.quantity} pcs
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ဆိုင်ခွဲရွေးချယ်ပြီးပါက အရေအတွက် ရိုက်ထည့်ရန် နေရာပေါ်လာမည် */}
          {selectedSourceBranchName && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Transfer Quantity
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={maxAvailable}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum requestable: {maxAvailable} pcs
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductId("");
                    setSelectedSourceBranchName("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Send Request
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
