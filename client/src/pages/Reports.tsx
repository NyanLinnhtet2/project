import React from 'react';

export default function Reports() {
  const branchSales = [
    { branch: 'Yangon ', sales: '$14,250', orders: 340, status: 'Online' },
    { branch: 'Mandalay ', sales: '$9,840', orders: 210, status: 'Online' },
    { branch: 'Naypyitaw ', sales: '$5,120', orders: 115, status: 'Offline (Local Mode) [cite: 11]' },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#FDFBF7] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-black text-[#111111] mb-2">Central Analytics Dashboard [cite: 8, 36]</h1>
        <p className="text-xs text-gray-400 mb-8">Master data reports synchronized periodically across all branches.</p>

        {/* Branch Overview Table Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-4">Branch Wise Performance [cite: 9]</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3">Branch Location [cite: 9]</th>
                  <th className="pb-3">Total Sales</th>
                  <th className="pb-3">Orders Processed [cite: 36]</th>
                  <th className="pb-3 text-right">Network Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {branchSales.map((b, idx) => (
                  <tr key={idx}>
                    <td className="py-4 font-bold text-[#111111]">{b.branch}</td>
                    <td className="py-4 font-semibold">{b.sales}</td>
                    <td className="py-4 text-gray-500">{b.orders} orders</td>
                    <td className="py-4 text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${b.status === 'Online' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sync Status Note */}
        <div className="p-4 bg-[#F3EFE6] rounded-xl text-xs text-gray-600 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#736B5E] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063 1.06l-.042.02a.75.75 0 01-1.063-1.06zm0 0a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0z" /></svg>
          <span><strong>Eventual Consistency Notice:</strong> Data syncing takes place periodically. Transactions from offline branches will appear automatically once reconnected[cite: 31, 32, 33].</span>
        </div>
      </div>
    </div>
  );
}