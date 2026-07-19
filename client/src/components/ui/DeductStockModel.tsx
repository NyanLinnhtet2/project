import React, { useState } from "react";
import { toast } from "react-hot-toast"; // သို့မဟုတ် သင်သုံးနေကျ Toast
import { deductBranchStockApi } from "../../services/inventoryService"; // အပေါ်က API function ကို Import လုပ်ပါ
import axios from "axios";
import type { ErrorResponse } from "../../types/ErrorResponse";

interface DeductStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  stockItem: any;
  onSuccess: () => void;
}

const DeductStockModal: React.FC<DeductStockModalProps> = ({
  isOpen,
  onClose,
  branchId,
  stockItem,
  onSuccess,
}) => {
  const [deductQty, setDeductQty] = useState<number>(1);
  const [reason, setReason] = useState<string>("");
  const [transactionType, setTransactionType] = useState<string>("ADJUSTMENT");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen || !stockItem) return null;

  const handleDeduct = async () => {
    // 1. Validation စစ်ဆေးခြင်း
    if (deductQty <= 0) {
      toast.error("လျှော့မည့် အရေအတွက်သည် အနည်းဆုံး ၁ ခု ရှိရပါမည်။");
      return;
    }
    if (deductQty > stockItem.quantity) {
      toast.error(
        `လက်ကျန်အရေအတွက် (${stockItem.quantity}) ထက် ကျော်လွန်၍ ဖျက်၍မရပါ။`,
      );
      return;
    }
    if (!reason.trim()) {
      toast.error("အကြောင်းပြချက် ထည့်သွင်းပေးပါ။");
      return;
    }

    // 2. API ခေါ်ရန် Data ပြင်ဆင်ခြင်း
    setIsLoading(true);
    try {
      const payload = {
        branchId: branchId,
        productId: stockItem.productId, // သင့် API က Product ID တောင်းသည့်အတွက်
        quantity: deductQty,
        performedBy: "Admin", // Login ဝင်ထားသည့် User အမည်ကို ဒီမှာ ပြောင်းထည့်ပါ (ဥပမာ user.name)
        notes: reason,
        transactionType: transactionType as
          | "OUTBOUND"
          | "DAMAGE"
          | "ADJUSTMENT",
      };

      const response = await deductBranchStockApi(payload);

      if (response.success) {
        toast.success("Stock လျှော့ချခြင်း အောင်မြင်ပါသည်");
        onSuccess(); // Parent Component ကို Data အသစ်ပြန်ခေါ်ခိုင်းခြင်း
        onClose(); // Modal ကို ပိတ်ခြင်း
      }
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;

      toast.error(message ?? "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Stock ဖျက်မည်/လျှော့မည်</h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            ကုန်ပစ္စည်း -{" "}
            <span className="font-semibold text-black">
              {stockItem?.product?.name}
            </span>
          </p>
          <p className="text-sm text-gray-600">
            လက်ရှိလက်ကျန် -{" "}
            <span className="font-semibold text-blue-600">
              {stockItem?.quantity} ခု
            </span>
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            ဖျက်မည့် အမျိုးအစား
          </label>
          <select
            className="w-full border p-2 rounded"
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
          >
            <option value="ADJUSTMENT">
              စာရင်းမှား၍ ပြန်လျှော့ခြင်း (Adjustment)
            </option>
            <option value="DAMAGE">ပျက်စီး/ဆုံးရှုံးခြင်း (Damage)</option>
            <option value="OUTBOUND">အခြားသို့ ထုတ်ပေးခြင်း (Outbound)</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">အရေအတွက်</label>
          <input
            type="number"
            min="1"
            max={stockItem.quantity}
            className="w-full border p-2 rounded"
            value={deductQty}
            onChange={(e) => setDeductQty(Number(e.target.value))}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            အကြောင်းပြချက် (Notes)
          </label>
          <textarea
            className="w-full border p-2 rounded"
            placeholder="ဥပမာ - ကြွက်ကိုက်၍ ပျက်စီးသွားသည်"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          ></textarea>
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={onClose}
            disabled={isLoading}
          >
            ပယ်ဖျက်မည် (Cancel)
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center"
            onClick={handleDeduct}
            disabled={isLoading}
          >
            {isLoading ? "လုပ်ဆောင်နေသည်..." : "အတည်ပြုသည် (Confirm)"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeductStockModal;
