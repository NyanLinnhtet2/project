import { useState, useEffect } from "react";
import {
  getBranchInventoryApi,
  allocateStockApi,
} from "../../services/inventoryService";
import { getBranchesApi } from "../../services/branchService";
import { getProductsApi } from "../../services/productService"; // Product API ကို import လုပ်ပါ
import type { Stock, AllocateStockData } from "../../types/inventory";
import type { Branch } from "../../types/branch";
import type { Product } from "../../types/product";

export const Inventory = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [inventory, setInventory] = useState<Stock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [allocateData, setAllocateData] = useState({
    productId: "",
    quantity: 0,
  });

  const fetchBranches = async () => {
    try {
      const res = await getBranchesApi();
      if (res.success) {
        setBranches(res.data);
        if (res.data.length > 0) setSelectedBranch(res.data[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch branches", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await getProductsApi();
      if (res.success) setProducts(res.data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchBranches();
      fetchProducts();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const fetchInventory = async (branchId: string) => {
    setLoading(true);
    try {
      const res = await getBranchInventoryApi(branchId);
      if (res.success) setInventory(res.data);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBranch) {
      const t = setTimeout(() => {
        fetchInventory(selectedBranch);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [selectedBranch]);

  const handleAllocateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedBranch ||
      !allocateData.productId ||
      allocateData.quantity <= 0
    ) {
      alert("ကျေးဇူးပြု၍ အချက်အလက်များကို မှန်ကန်စွာ ဖြည့်စွက်ပါ။");
      return;
    }

    try {
      const payload: AllocateStockData = {
        branchId: selectedBranch,
        productId: allocateData.productId,
        quantity: allocateData.quantity,
      };

      const res = await allocateStockApi(payload);
      if (res.success) {
        alert("Stock ထည့်သွင်းခြင်း အောင်မြင်ပါသည်။");
        setIsModalOpen(false);
        setAllocateData({ productId: "", quantity: 0 });
        fetchInventory(selectedBranch); // ဇယားကို Refresh ပြန်လုပ်ရန်
      }
    } catch (error) {
      console.error("Failed to allocate stock", error);
      alert("Stock ထည့်သွင်းရာတွင် အခက်အခဲရှိနေပါသည်။");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-100 text-green-800";
      case "Low Stock":
        return "bg-yellow-100 text-yellow-800";
      case "Out of Stock":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          + Add Stock
        </button>
      </div>

      {/* Branch Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Branch
        </label>
        <select
          className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
        >
          {branches.map((branch) => (
            <option key={branch._id} value={branch._id}>
              {branch.name} ({branch.code})
            </option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : inventory.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No stock found for this branch.
                </td>
              </tr>
            ) : (
              inventory.map((item) => (
                <tr key={item._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.product?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.product?.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">
                      Transfer
                    </button>
                    <button className="text-indigo-600 hover:text-indigo-900">
                      History
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Stock Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Allocate Stock to Branch</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAllocateStock}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Product
                </label>
                <select
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={allocateData.productId}
                  onChange={(e) =>
                    setAllocateData({
                      ...allocateData,
                      productId: e.target.value,
                    })
                  }
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} (SKU: {product.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={allocateData.quantity}
                  onChange={(e) =>
                    setAllocateData({
                      ...allocateData,
                      quantity: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
