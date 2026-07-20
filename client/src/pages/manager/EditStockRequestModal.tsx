import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { X, Loader2, PenSquare } from "lucide-react";
import { requestStockEditApi } from "../../services/inventoryService";
import type { Stock } from "../../types/inventory";
import type { Product } from "../../types/product";

// Extended Stock type with populated product (same pattern used elsewhere)
interface StockWithProduct extends Stock {
  product?: Product;
}

interface EditStockRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  stockItem: Stock | null;
  performedBy: string; // manager's name
  onSuccess: () => void;
}

// ============================================================
// Request Stock Edit Modal
// A Manager fills this in to ask an Admin to change a product's
// quantity. It POSTs to /inventory/stock-edit-request and creates
// a PENDING StockEditRequest — it does NOT change stock directly.
// ============================================================
const EditStockRequestModal: React.FC<EditStockRequestModalProps> = ({
  isOpen,
  onClose,
  branchId,
  stockItem,
  performedBy,
  onSuccess,
}) => {
  const [requestedQuantity, setRequestedQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Reset the form each time a new stock item is selected / modal reopened
  useEffect(() => {
    if (isOpen && stockItem) {
      const t = setTimeout(() => {
        setRequestedQuantity(stockItem.quantity);
        setReason("");
      }, 0);

      return () => clearTimeout(t);
    }
  }, [isOpen, stockItem]);

  if (!isOpen || !stockItem) return null;

  const getProductName = (): string => {
    const item = stockItem as StockWithProduct;
    if (item.product) return item.product.name;
    if (
      typeof stockItem.productId === "object" &&
      stockItem.productId !== null
    ) {
      return (stockItem.productId as Product).name;
    }
    return "Unknown Product";
  };

  const getProductId = (): string => {
    const item = stockItem as StockWithProduct;
    if (item.product) return item.product._id;
    if (typeof stockItem.productId === "string") return stockItem.productId;
    if (
      typeof stockItem.productId === "object" &&
      stockItem.productId !== null
    ) {
      return (stockItem.productId as Product)._id;
    }
    return "";
  };

  const changeAmount = requestedQuantity - stockItem.quantity;

  const handleSubmit = async (): Promise<void> => {
    const productId = getProductId();

    if (!productId) {
      toast.error("Product ID not found");
      return;
    }
    if (requestedQuantity < 0) {
      toast.error("Requested quantity ဟာ အနုတ်ဂဏန်း ဖြစ်လို့ မရပါ။");
      return;
    }
    if (requestedQuantity === stockItem.quantity) {
      toast.error(
        "Requested quantity ဟာ လက်ရှိ stock နဲ့ တူနေပါတယ်။ ကွာခြားချက် တစ်ခုခု ထည့်ပါ။",
      );
      return;
    }
    if (!reason.trim()) {
      toast.error("အကြောင်းပြချက် ထည့်သွင်းပေးပါ။");
      return;
    }

    setIsLoading(true);
    try {
      const response = await requestStockEditApi({
        branchId,
        productId,
        requestedQuantity,
        reason: reason.trim(),
        requestedBy: performedBy || "Manager",
      });

      if (response.success) {
        toast.success("Request တင်ပြီးပါပြီ — Admin approve လုပ်ဖို့ စောင့်ပါ");
        onSuccess();
        onClose();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message ??
          "Request တင်ရာတွင် အမှားတစ်ခု ဖြစ်ပွားပါသည်",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <PenSquare size={20} className="text-blue-600" />
            Request Stock Edit
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-slate-100"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm text-slate-700">
            Product:{" "}
            <span className="font-semibold text-slate-900">
              {getProductName()}
            </span>
          </p>
          <p className="text-sm text-slate-700">
            Current Stock:{" "}
            <span className="font-semibold text-blue-600">
              {stockItem.quantity} units
            </span>
          </p>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Requested Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:shadow-md"
            value={requestedQuantity}
            onChange={(e) => setRequestedQuantity(Number(e.target.value))}
          />
          {changeAmount !== 0 && (
            <p
              className={`mt-1 text-xs font-medium ${
                changeAmount > 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {changeAmount > 0 ? "+" : ""}
              {changeAmount} from current stock
            </p>
          )}
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:shadow-md"
            rows={3}
            placeholder="ဥပမာ - Physical count လုပ်တော့ stock ကွာခြားနေလို့ (Damaged items, Recount, etc.)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-200 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 py-3 font-medium text-white transition hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                Submitting...
              </span>
            ) : (
              "Submit Request"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStockRequestModal;
