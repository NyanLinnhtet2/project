export const Branch = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Branch Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Add New Branch
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-semibold text-gray-600">Branch Name</th>
              <th className="p-4 font-semibold text-gray-600">Code</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
              <th className="p-4 font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="p-4">Yangon Branch</td>
              <td className="p-4">YGN</td>
              <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm">Active</span></td>
              <td className="p-4"><button className="text-blue-500 hover:underline">Edit</button></td>
            </tr>
            <tr className="border-b hover:bg-gray-50">
              <td className="p-4">Mandalay Branch</td>
              <td className="p-4">MDY</td>
              <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm">Active</span></td>
              <td className="p-4"><button className="text-blue-500 hover:underline">Edit</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};