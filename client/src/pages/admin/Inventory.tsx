import {
  Package,
  Search,
  Store,
  AlertCircle,
  AlertTriangle,
 
  Loader2,
  PlusCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
 
  DollarSign,
  Grid3x3,
  List,

} from "lucide-react";
import { useState, useEffect } from "react";

// ============================================================
// Types
// ============================================================
interface Branch {
  _id: string;
  name: string;
  code: string;
  status: string;
}

interface ProductStock {
  productId: string;
  productName: string;
  productSku: string;
  price: number;
  unit: string;
  totalStock: number;
  branchStocks: {
    branch: string;
    quantity: number;
  }[];
}

interface InventoryStats {
  totalProducts: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  branches: {
    name: string;
    productCount: number;
    totalQuantity: number;
    totalValue: number;
  }[];
}

// ============================================================
// Stats Cards Component
// ============================================================
const StatsCards = ({ stats, isLoading }: { stats: InventoryStats; isLoading: boolean }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("my-MM", {
      style: "currency",
      currency: "MMK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-6 shadow-sm animate-pulse">
            <div className="h-20 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Products</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalProducts}</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3">
            <Package size={20} className="text-blue-600" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Stock Value</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {formatCurrency(stats.totalStockValue)}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3">
            <DollarSign size={20} className="text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Low Stock Items</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{stats.lowStockItems}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Out of Stock</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{stats.outOfStockItems}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-3">
            <AlertCircle size={20} className="text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Branch Summary Component
// ============================================================
const BranchSummary = ({ branches }: { branches: InventoryStats['branches'] }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("my-MM", {
      style: "currency",
      currency: "MMK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (branches.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {branches.map((branch, index) => (
        <div
          key={index}
          className="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-center gap-2">
            <Store size={16} className="text-blue-600" />
            <p className="text-sm font-medium text-slate-700 truncate">{branch.name}</p>
          </div>
          <p className="mt-1 text-lg font-bold text-slate-900">{branch.totalQuantity}</p>
          <p className="text-xs text-slate-500">{branch.productCount} products</p>
          <p className="text-xs text-emerald-600 font-medium">{formatCurrency(branch.totalValue)}</p>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// Product Stock Row Component
// ============================================================
const ProductStockRow = ({ 
  product, 
  onAddStock 
}: { 
  product: ProductStock;
  onAddStock: (productId: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const getStockStatus = (qty: number) => {
    if (qty === 0) {
      return { label: "Out of Stock", className: "bg-red-100 text-red-700" };
    } else if (qty <= 5) {
      return { label: "Very Low", className: "bg-red-100 text-red-700" };
    } else if (qty <= 10) {
      return { label: "Low", className: "bg-amber-100 text-amber-700" };
    } else if (qty <= 20) {
      return { label: "Medium", className: "bg-blue-100 text-blue-700" };
    } else {
      return { label: "In Stock", className: "bg-emerald-100 text-emerald-700" };
    }
  };

  const status = getStockStatus(product.totalStock);

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      {/* Main Row */}
      <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate">{product.productName}</p>
            <p className="text-xs text-slate-500">SKU: {product.productSku}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">{product.totalStock}</p>
              <p className="text-xs text-slate-400">{product.unit}</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
              {status.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddStock(product.productId)}
            className="rounded-lg bg-emerald-100 p-2 text-emerald-600 transition hover:bg-emerald-200"
            title="Add Stock"
          >
            <PlusCircle size={16} />
          </button>
        </div>
      </div>

      {/* Expanded Section - Branch Stocks */}
      {isExpanded && (
        <div className="border-t border-slate-200 px-4 py-4 bg-slate-50/50">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Stock by Branch</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {product.branchStocks.map((branchStock, idx) => {
              const branchStatus = getStockStatus(branchStock.quantity);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <Store size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {branchStock.branch}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">{branchStock.quantity}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${branchStatus.className}`}
                    >
                      {branchStatus.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Main Inventory Component
// ============================================================
export const Inventory = () => {
  // Sample data - In production, fetch from API
  const [products, setProducts] = useState<ProductStock[]>([
    {
      productId: "1",
      productName: "Nike Air Max 270",
      productSku: "PRD-001",
      price: 120000,
      unit: "pairs",
      totalStock: 45,
      branchStocks: [
        { branch: "Yangon Downtown", quantity: 25 },
        { branch: "Mandalay City", quantity: 15 },
        { branch: "Naypyitaw", quantity: 5 },
      ],
    },
    {
      productId: "2",
      productName: "Adidas Hoodie Classic",
      productSku: "PRD-002",
      price: 85000,
      unit: "pcs",
      totalStock: 32,
      branchStocks: [
        { branch: "Yangon Downtown", quantity: 12 },
        { branch: "Mandalay City", quantity: 20 },
      ],
    },
    {
      productId: "3",
      productName: "Puma T-Shirt Essential",
      productSku: "PRD-003",
      price: 35000,
      unit: "pcs",
      totalStock: 0,
      branchStocks: [
        { branch: "Yangon Downtown", quantity: 0 },
        { branch: "Mandalay City", quantity: 0 },
      ],
    },
    {
      productId: "4",
      productName: "Uniqlo Slim Fit Pants",
      productSku: "PRD-004",
      price: 55000,
      unit: "pcs",
      totalStock: 28,
      branchStocks: [
        { branch: "Yangon Downtown", quantity: 18 },
        { branch: "Naypyitaw", quantity: 10 },
      ],
    },
    {
      productId: "5",
      productName: "Zara Leather Jacket",
      productSku: "PRD-005",
      price: 150000,
      unit: "pcs",
      totalStock: 8,
      branchStocks: [
        { branch: "Yangon Downtown", quantity: 5 },
        { branch: "Mandalay City", quantity: 3 },
      ],
    },
    {
      productId: "6",
      productName: "H&M Winter Scarf",
      productSku: "PRD-006",
      price: 25000,
      unit: "pcs",
      totalStock: 12,
      branchStocks: [
        { branch: "Mandalay City", quantity: 12 },
      ],
    },
  ]);

  const [filteredProducts, setFilteredProducts] = useState<ProductStock[]>(products);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sample branches
  const branches: Branch[] = [
    { _id: "1", name: "Yangon Downtown", code: "YGN001", status: "active" },
    { _id: "2", name: "Mandalay City", code: "MDY001", status: "active" },
    { _id: "3", name: "Naypyitaw", code: "NPT001", status: "active" },
  ];

  // Sample stats
  const stats: InventoryStats = {
    totalProducts: 6,
    totalStockValue: 5980000,
    lowStockItems: 2,
    outOfStockItems: 1,
    branches: [
      { name: "Yangon Downtown", productCount: 5, totalQuantity: 60, totalValue: 3500000 },
      { name: "Mandalay City", productCount: 4, totalQuantity: 50, totalValue: 2500000 },
      { name: "Naypyitaw", productCount: 2, totalQuantity: 15, totalValue: 750000 },
    ],
  };

  // Filter products
  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.productName.toLowerCase().includes(term) ||
          p.productSku.toLowerCase().includes(term)
      );
    }

    if (selectedBranch !== "All") {
      filtered = filtered.filter((p) =>
        p.branchStocks.some((bs) => bs.branch === selectedBranch)
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedBranch, products]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleAddStock = (productId: string) => {
    console.log("Add stock for product:", productId);
    // Open add stock modal
  };

  const getStockStatus = (qty: number) => {
    if (qty === 0) {
      return { label: "Out of Stock", className: "bg-red-100 text-red-700" };
    } else if (qty <= 5) {
      return { label: "Very Low", className: "bg-red-100 text-red-700" };
    } else if (qty <= 10) {
      return { label: "Low", className: "bg-amber-100 text-amber-700" };
    } else if (qty <= 20) {
      return { label: "Medium", className: "bg-blue-100 text-blue-700" };
    } else {
      return { label: "In Stock", className: "bg-emerald-100 text-emerald-700" };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Track and manage stock across all branches
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-semibold text-slate-700 shadow-sm transition-all hover:shadow-md active:scale-95 border border-slate-200"
            >
              <RefreshCw size={20} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <StatsCards stats={stats} isLoading={false} />

        {/* Branch Summary */}
        <BranchSummary branches={stats.branches} />

        {/* Search and Filter */}
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="All">All Branches</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch.name}>
                  {branch.name}
                </option>
              ))}
            </select>

            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-3 transition ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-3 transition ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Display */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <Package className="h-16 w-16 text-slate-300 mx-auto" />
            <h3 className="mt-4 text-xl font-semibold text-slate-600">No inventory found</h3>
            <p className="mt-2 text-slate-400">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const status = getStockStatus(product.totalStock);
              return (
                <div
                  key={product.productId}
                  className="group rounded-2xl bg-white shadow-sm overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 line-clamp-1">
                          {product.productName}
                        </h3>
                        <p className="text-sm text-slate-500">SKU: {product.productSku}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{product.totalStock}</p>
                        <p className="text-xs text-slate-400">Unit: {product.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Price</p>
                        <p className="font-medium text-slate-900">
                          {new Intl.NumberFormat("my-MM", {
                            style: "currency",
                            currency: "MMK",
                          }).format(product.price)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <p className="text-xs font-medium text-slate-500 mb-2">Branch Stocks:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {product.branchStocks.map((bs, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs text-slate-600"
                          >
                            <Store size={12} className="text-blue-500" />
                            {bs.branch}: {bs.quantity}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={() => handleAddStock(product.productId)}
                        className="w-full rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-200"
                      >
                        <PlusCircle size={14} className="inline mr-1" />
                        Add Stock
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <ProductStockRow
                key={product.productId}
                product={product}
                onAddStock={handleAddStock}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;