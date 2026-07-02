import React from 'react';

export default function Orders() {
  const currentOrders = [
    { orderId: '#TX-1002', time: '10:24 AM', items: 'Linen Shirt x 2', total: '$70.00', branch: 'Yangon Branch ', sync: 'Synced [cite: 28]' },
    { orderId: '#TX-1001', time: '09:15 AM', items: 'Denim Jeans x 1', total: '$40.00', branch: 'Yangon Branch ', sync: 'Pending [cite: 41]' },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#FDFBF7] py-12 px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns - Order History */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#111111]">POS Transactions [cite: 23, 38]</h1>
              <p className="text-xs text-gray-400 mt-1">Real-time local orders from your branch[cite: 25, 27].</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="pb-3">Tx ID</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs md:text-sm text-gray-700">
                {currentOrders.map((order, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 font-bold text-[#111111]">{order.orderId}</td>
                    <td className="py-4 text-gray-600">{order.items}</td>
                    <td className="py-4 font-semibold text-[#111111]">{order.total}</td>
                    <td className="py-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${order.sync === 'Synced [cite: 28]' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {order.sync}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Column - Quick Actions for Cashier / Manager */}
        <div className="space-y-6">
          {/* New Transaction Action */}
          <div className="bg-[#1A1A1A] text-white p-6 rounded-3xl shadow-md">
            <h3 className="font-bold text-lg mb-2">Cashier POS Terminal [cite: 13, 23]</h3>
            <p className="text-xs text-gray-400 mb-6">Open point-of-sale interface to process walk-in customer orders[cite: 21].</p>
            <button className="w-full py-3 bg-[#E2675A] hover:bg-[#d15649] text-white text-xs font-bold rounded-xl transition-colors shadow-sm">
              Create New Order [cite: 26]
            </button>
          </div>

          {/* Sync Queue Monitor */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Local Sync Queue [cite: 33, 38]</h4>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="text-2xl font-black text-[#111111]">1 Pending [cite: 41]</div>
            <p className="text-[11px] text-gray-400 mt-1">Offline transactions saved in local DB. Will auto sync when connection returns[cite: 11, 41].</p>
          </div>
        </div>

      </div>
    </div>
  );
}