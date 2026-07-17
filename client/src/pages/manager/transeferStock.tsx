import React, { useState, useEffect } from "react";
import {
  getProductStockAcrossBranchesApi,
  createTransferRequestApi,
} from "../../services/transferService";
import type { BranchStockInfo } from "../../types/transfer";
import type { Product } from "../../types/product";

interface TransferRequestModalProps {
  product: Product;
  currentBranchId: string; // လက်ရှိ Login ဝင်ထားသည့် Manager ၏ ဆိုင်ခွဲ ID
  username: string; // Login User Account အမည်
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferRequestModal: React.FC<TransferRequestModalProps> = ({
  product,
  currentBranchId,
  username,
  onClose,
  onSuccess,
}) => {
  const [stocks, setStocks] = useState<BranchStockInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSourceBranch, setSelectedSourceBranch] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [maxAvailable, setMaxAvailable] = useState<number>(0);

  const fetchStocks = async () => {
    try {
      const res = await getProductStockAcrossBranchesApi(product._id);
      if (res.success) {
        // မိမိလက်ရှိဆိုင်မဟုတ်သော တခြားဆိုင်များကိုသာ စာရင်းထုတ်မည်
        const otherBranches = res.data.filter(
          (b) => b.branchId !== currentBranchId,
        );
        setStocks(otherBranches);
      }
    } catch (error) {
      console.error("Error loading branch stocks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchStocks();
    }, 0);

    return () => clearTimeout(t);
  }, [product._id]);

  const handleBranchChange = (branchId: string) => {
    setSelectedSourceBranch(branchId);
    const selected = stocks.find((s) => s.branchId === branchId);
    setMaxAvailable(selected ? selected.quantity : 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSourceBranch || quantity <= 0) {
      alert("အချက်အလက်များကို မှန်ကန်စွာ ဖြည့်သွင်းပါ။");
      return;
    }
    if (quantity > maxAvailable) {
      alert(
        "တောင်းဆိုသည့် အရေအတွက်သည် ထိုဆိုင်ခွဲရှိ Stock ထက် ကျော်လွန်နေပါသည်။",
      );
      return;
    }

    try {
      const res = await createTransferRequestApi({
        fromBranchId: selectedSourceBranch,
        toBranchId: currentBranchId,
        productId: product._id,
        quantity,
        requestedBy: username,
      });

      if (res.success) {
        alert(res.message);
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "တောင်းဆိုမှု မအောင်မြင်ပါ။");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-lg font-bold text-gray-800">
            Request Stock Transfer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            &times;
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Product: <strong className="text-gray-900">{product.name}</strong>
          </p>
          <p className="text-sm text-gray-600">
            SKU: <strong className="text-gray-900">{product.sku}</strong>
          </p>
        </div>

        {loading ? (
          <p className="text-center py-4">Loading Stock Info...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* အခြားဆိုင်များတွင် ရှိသော stock များကို ဇယားဖြင့် ပြသခြင်း */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Available Stock in Other Branches
              </label>
              <div className="border rounded-md overflow-hidden max-h-40 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Branch</th>
                      <th className="px-4 py-2 text-right">Available Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stocks.map((s) => (
                      <tr
                        key={s.branchId}
                        className={`cursor-pointer hover:bg-blue-50 ${selectedSourceBranch === s.branchId ? "bg-blue-100" : ""}`}
                        onClick={() => handleBranchChange(s.branchId)}
                      >
                        <td className="px-4 py-2">
                          {s.branchName} ({s.branchCode})
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-blue-600">
                          {s.quantity} pcs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedSourceBranch && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
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

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Send Request
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
