export const Product = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Product Management</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          + Add New Product
        </button>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500">
        <p>Product list table will be displayed here.</p>
        <p className="text-sm mt-2">
          Data will be fetched from Central Database.
        </p>
      </div>
    </div>
  );
};
