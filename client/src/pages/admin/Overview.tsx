export const Overview = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Dashboard Overview
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <h2 className="text-gray-500 text-sm font-semibold">
            Total Branches
          </h2>
          <p className="text-3xl font-bold mt-2">3</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <h2 className="text-gray-500 text-sm font-semibold">
            Total Products
          </h2>
          <p className="text-3xl font-bold mt-2">124</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
          <h2 className="text-gray-500 text-sm font-semibold">Today's Sales</h2>
          <p className="text-3xl font-bold mt-2">15</p>
        </div>
      </div>
    </div>
  );
};
