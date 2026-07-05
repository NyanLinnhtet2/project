import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  Building2,
  Phone,
  User,
  MoreVertical,
} from "lucide-react";
import { useState } from "react";

// Define types
interface BranchFormData {
  branchName: string;
  code: string;
  phone: string;
  manager: string;
  address: string;
  status: "Active" | "Inactive";
}

// Sample managers data
const managers = [
  { id: "1", name: "Aung Aung" },
  { id: "2", name: "Kyaw Kyaw" },
  { id: "3", name: "Su Su" },
  { id: "4", name: "Mg Mg" },
  { id: "5", name: "Hla Hla" },
];

export const Branch = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<BranchFormData>({
    branchName: "",
    code: "",
    phone: "",
    manager: "",
    address: "",
    status: "Active",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form Data:", formData);
    setIsModalOpen(false);
    setFormData({
      branchName: "",
      code: "",
      phone: "",
      manager: "",
      address: "",
      status: "Active",
    });
  };

  // Sample branch data
  const branches = [
    {
      id: 1,
      name: "Yangon Branch",
      code: "YGN001",
      phone: "09-123456789",
      manager: "Aung Aung",
      address: "Hledan Township",
      status: "Active",
      employees: 45,
      revenue: "$2.4M",
    },
    {
      id: 2,
      name: "Mandalay Branch",
      code: "MDY001",
      phone: "09-987654321",
      manager: "Kyaw Kyaw",
      address: "Chan Aye Tharzan",
      status: "Active",
      employees: 32,
      revenue: "$1.8M",
    },
    {
      id: 3,
      name: "Naypyidaw Branch",
      code: "NPT001",
      phone: "09-456789123",
      manager: "Su Su",
      address: "Zabuthiri Township",
      status: "Inactive",
      employees: 0,
      revenue: "$0",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Branch Management
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Manage and monitor all retail locations
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
          >
            <Plus size={20} />
            Add New Branch
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-medium text-slate-500">Total Branches</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">12</p>
            <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
              <span>↑ 12%</span>
              <span className="text-slate-400">from last month</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-medium text-slate-500">
              Active Branches
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">10</p>
            <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600">
              <span>●</span>
              <span className="text-slate-400">83% of total</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-medium text-slate-500">
              Total Employees
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">342</p>
            <div className="mt-3 flex items-center gap-1 text-xs text-blue-600">
              <span>↑ 8%</span>
              <span className="text-slate-400">this quarter</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-medium text-slate-500">Revenue</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">$4.2M</p>
            <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
              <span>↑ 23%</span>
              <span className="text-slate-400">year over year</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search branches by name, code, or manager..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
            />
          </div>
          <div className="flex gap-3">
            <select className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white">
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <select className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white">
              <option>Sort by: Latest</option>
              <option>Name A-Z</option>
              <option>Name Z-A</option>
            </select>
          </div>
        </div>

        {/* Branch Cards Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="group rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {branch.name}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        branch.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {branch.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {branch.address}
                  </p>
                </div>
                <button className="rounded-lg p-1.5 opacity-0 transition hover:bg-slate-100 group-hover:opacity-100">
                  <MoreVertical size={18} className="text-slate-400" />
                </button>
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Code size={16} className="text-slate-400" />
                  <span className="font-mono font-medium">{branch.code}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={16} className="text-slate-400" />
                  <span>{branch.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User size={16} className="text-slate-400" />
                  <span>Manager: {branch.manager}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Employees</p>
                    <p className="font-semibold text-slate-900">
                      {branch.employees}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Revenue</p>
                    <p className="font-semibold text-slate-900">
                      {branch.revenue}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button className="rounded-xl bg-slate-100 p-2 transition hover:bg-slate-200">
                    <Eye size={16} className="text-slate-600" />
                  </button>
                  <button className="rounded-xl bg-blue-100 p-2 text-blue-600 transition hover:bg-blue-200">
                    <Pencil size={16} />
                  </button>
                  <button className="rounded-xl bg-red-100 p-2 text-red-600 transition hover:bg-red-200">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Branch Modal - Keeping original styling */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  Add New Branch
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-2 transition hover:bg-slate-100"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      name="branchName"
                      value={formData.branchName}
                      onChange={handleInputChange}
                      placeholder="Enter branch name"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Branch Code
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="e.g., YGN001"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Manager
                    </label>
                    <select
                      name="manager"
                      value={formData.manager}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                      required
                    >
                      <option value="">Select Manager</option>
                      {managers.map((manager) => (
                        <option key={manager.id} value={manager.name}>
                          {manager.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter branch address"
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700"
                  >
                    Add Branch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Code = ({ size, className }: { size: number; className: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);
