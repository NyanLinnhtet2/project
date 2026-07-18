import React from "react";

interface StockItem {
  _id: string;
  productId:
    | {
        _id: string;
        name: string;
        sku: string;
      }
    | string;
  quantity: number;
  status: string;
}

interface StockListProps {
  items: StockItem[];
}

export const StockList: React.FC<StockListProps> = ({ items }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Product Name
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
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => {
            // Data ကို Object သို့မဟုတ် String ဖြစ်နိုင်ခြေရှိလို့ Safe ဖြစ်အောင် ခွဲယူခြင်း
            const productName =
              typeof item.productId === "object"
                ? item.productId?.name
                : "Product ID: " + item.productId;

            const productSku =
              typeof item.productId === "object" ? item.productId?.sku : "-";

            return (
              <tr key={item._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {productName || "Unknown"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{productSku}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      item.status === "In Stock"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
