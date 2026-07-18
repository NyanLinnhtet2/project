import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  getTransfersApi,
  approveTransferApi,
  rejectTransferApi,
} from "../../services/transferService"; // ဆရာ့ Path အတိုင်း ပြင်ပေးပါ
import type { TransferRecord } from "../../types/transfer";
import { useAuth } from "../../context/useAuth";

export const AdminTransferManagement = () => {
  const { userInfo } = useAuth();
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Transfer အချက်အလက်များ ဆွဲယူခြင်း
  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await getTransfersApi();
      if (res.success) {
        setTransfers(res.data);
      }
    } catch (error) {
      toast.error("Error loading transfer requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchTransfers(), 0);
    return () => clearTimeout(t);
  }, []);

  // Approve လုပ်ခြင်း
  const handleApprove = async (id: string) => {
    try {
      const res = await approveTransferApi(id, userInfo?.name || "Admin");
      if (res.success) {
        toast.success("Request approved successfully");
        fetchTransfers(); // List ပြန် refresh လုပ်
      }
    } catch (error) {
      toast.error("Failed to approve");
    }
  };

  // Reject လုပ်ခြင်း
  const handleReject = async (id: string) => {
    try {
      const res = await rejectTransferApi(id, userInfo?.name || "Admin");
      if (res.success) {
        toast.success("Request rejected");
        fetchTransfers(); // List ပြန် refresh လုပ်
      }
    } catch (error) {
      toast.error("Failed to reject");
    }
  };

  if (loading) {
    return <h1>Loading...</h1>;
  }
  return (
    <div className="bg-white rounded-lg shadow p-4">
      {" "}
      {/* p-6 အစား p-4 သို့မဟုတ် ပိုသေးအောင်လုပ်ပါ */}
      <h2 className="text-lg font-bold mb-4">Pending Transfer Requests</h2>
      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                From - To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Qty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transfers.map((t) => (
              <tr key={t._id}>
                <td className="px-6 py-4">
                  {typeof t.fromBranchId === "string"
                    ? t.fromBranchId
                    : t.fromBranchId?.name || "Unknown"}
                </td>{" "}
                {/* Name ပြချင်ရင် Populating လုပ်ပေးဖို့ လိုပါမယ် */}
                <td className="px-6 py-4">
                  {typeof t.fromBranchId === "string"
                    ? t.fromBranchId
                    : t.fromBranchId?.name || "Unknown"}
                  ➔
                  {typeof t.toBranchId === "string"
                    ? t.toBranchId
                    : t.toBranchId?.name || "Unknown"}
                </td>
                <td className="px-6 py-4">{t.quantity}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-xs ${t.status === "pending" ? "bg-yellow-100" : t.status === "approved" ? "bg-green-100" : "bg-red-100"}`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-6 py-4 gap-2 flex">
                  {t.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(t._id)}
                        className="text-green-600 hover:text-green-800 font-bold"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(t._id)}
                        className="text-red-600 hover:text-red-800 font-bold"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
