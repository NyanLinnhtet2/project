import {
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  Briefcase,
  Clock,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useState, useRef } from "react";

// Types
interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  branch: string;
  joinDate: string;
  status: "active" | "inactive" | "on-leave";
  avatar?: string;
  role: "admin" | "manager" | "cashier";
}

interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  position: string;
  branch: string;
  role: "admin" | "manager" | "cashier";
  status: "active" | "inactive" | "on-leave";
  password: string;
  avatar: File | null;
  avatarPreview: string;
}

export const Employees = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<EmployeeFormData>({
    name: "",
    email: "",
    phone: "",
    position: "",
    branch: "",
    role: "cashier",
    status: "active",
    password: "",
    avatar: null,
    avatarPreview: "",
  });

  // Sample employees data with avatars
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: "1",
      name: "Aung Aung",
      email: "aung.aung@clothhub.com",
      phone: "09-123456789",
      position: "Store Manager",
      branch: "Yangon Downtown",
      joinDate: "2023-01-15",
      status: "active",
      role: "manager",
      avatar:
        "https://ui-avatars.com/api/?name=Aung+Aung&background=6366f1&color=fff&size=128",
    },
    {
      id: "2",
      name: "Mya Mya",
      email: "mya.mya@clothhub.com",
      phone: "09-234567890",
      position: "Senior Cashier",
      branch: "Yangon Downtown",
      joinDate: "2023-03-20",
      status: "active",
      role: "cashier",
      avatar:
        "https://ui-avatars.com/api/?name=Mya+Mya&background=ec4899&color=fff&size=128",
    },
    {
      id: "3",
      name: "Kyaw Kyaw",
      email: "kyaw.kyaw@clothhub.com",
      phone: "09-345678901",
      position: "Branch Manager",
      branch: "Mandalay City",
      joinDate: "2023-02-10",
      status: "active",
      role: "manager",
      avatar:
        "https://ui-avatars.com/api/?name=Kyaw+Kyaw&background=8b5cf6&color=fff&size=128",
    },
    {
      id: "4",
      name: "Su Su",
      email: "su.su@clothhub.com",
      phone: "09-456789012",
      position: "Cashier",
      branch: "Mandalay City",
      joinDate: "2023-04-05",
      status: "on-leave",
      role: "cashier",
      avatar:
        "https://ui-avatars.com/api/?name=Su+Su&background=14b8a6&color=fff&size=128",
    },
    {
      id: "5",
      name: "Min Thu",
      email: "min.thu@clothhub.com",
      phone: "09-567890123",
      position: "Inventory Manager",
      branch: "Naypyitaw",
      joinDate: "2023-05-12",
      status: "inactive",
      role: "manager",
      avatar:
        "https://ui-avatars.com/api/?name=Min+Thu&background=f59e0b&color=fff&size=128",
    },
    {
      id: "6",
      name: "Hla Hla",
      email: "hla.hla@clothhub.com",
      phone: "09-678901234",
      position: "Cashier",
      branch: "Naypyitaw",
      joinDate: "2023-06-01",
      status: "active",
      role: "cashier",
      avatar:
        "https://ui-avatars.com/api/?name=Hla+Hla&background=10b981&color=fff&size=128",
    },
  ]);

  const branches = [
    "Yangon Downtown",
    "Yangon Sanchaung",
    "Mandalay City",
    "Mandalay Aungmyay",
    "Naypyitaw",
    "Bago",
    "Pathein",
  ];

  const positions = [
    "Store Manager",
    "Branch Manager",
    "Senior Cashier",
    "Cashier",
    "Inventory Manager",
    "Sales Associate",
    "Marketing Executive",
    "HR Executive",
    "Accountant",
  ];

  const roles = [
    { value: "admin", label: "Admin" },
    { value: "manager", label: "Manager" },
    { value: "cashier", label: "Cashier" },
  ];

  const statusOptions = [
    {
      value: "active",
      label: "Active",
      color: "bg-emerald-100 text-emerald-700",
    },
    { value: "inactive", label: "Inactive", color: "bg-red-100 text-red-700" },
    {
      value: "on-leave",
      label: "On Leave",
      color: "bg-amber-100 text-amber-700",
    },
  ];

  // Stats
  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === "active").length,
    onLeave: employees.filter((e) => e.status === "on-leave").length,
    inactive: employees.filter((e) => e.status === "inactive").length,
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Please upload a valid image file (JPEG, PNG, JPG, GIF, WebP)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          avatar: file,
          avatarPreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      avatar: null,
      avatarPreview: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: API call to create employee with image
    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "avatar" && formData.avatar) {
        formDataToSend.append(key, formData.avatar as File);
      } else if (key !== "avatarPreview") {
        formDataToSend.append(
          key,
          formData[key as keyof EmployeeFormData] as string,
        );
      }
    });

    console.log("Form Data:", formData);
    console.log("Form Data to Send:", formDataToSend);

    setIsModalOpen(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      position: "",
      branch: "",
      role: "cashier",
      status: "active",
      password: "",
      avatar: null,
      avatarPreview: "",
    });
  };

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      setEmployees(employees.filter((e) => e.id !== id));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
      inactive: { label: "Inactive", className: "bg-red-100 text-red-700" },
      "on-leave": {
        label: "On Leave",
        className: "bg-amber-100 text-amber-700",
      },
    };
    const s = statusMap[status as keyof typeof statusMap] || statusMap.inactive;
    return (
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}
      >
        {s.label}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleMap = {
      admin: { label: "Admin", className: "bg-purple-100 text-purple-700" },
      manager: { label: "Manager", className: "bg-blue-100 text-blue-700" },
      cashier: { label: "Cashier", className: "bg-cyan-100 text-cyan-700" },
    };
    const r = roleMap[role as keyof typeof roleMap] || roleMap.cashier;
    return (
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.className}`}
      >
        {r.label}
      </span>
    );
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.branch.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || employee.status === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Employee Management
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Manage your workforce across all branches
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
          >
            <UserPlus size={20} />
            Add New Employee
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Employees
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <Users size={20} className="text-blue-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
              <span>↑ 8%</span>
              <span className="text-slate-400">from last month</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active Employees
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {stats.active}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <UserCheck size={20} className="text-emerald-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle size={12} />
              <span className="text-slate-400">
                {Math.round((stats.active / stats.total) * 100)}% of total
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">On Leave</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {stats.onLeave}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <Clock size={20} className="text-amber-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle size={12} />
              <span className="text-slate-400">Temporarily unavailable</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Inactive</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {stats.inactive}
                </p>
              </div>
              <div className="rounded-xl bg-red-50 p-3">
                <UserX size={20} className="text-red-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-red-600">
              <UserX size={12} />
              <span className="text-slate-400">Needs attention</span>
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
              placeholder="Search employees by name, email, position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="On-Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white">
              <option>Sort by: Latest</option>
              <option>Name A-Z</option>
              <option>Name Z-A</option>
            </select>
          </div>
        </div>

        {/* Employee Table */}
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <Users className="h-16 w-16 text-slate-300 mx-auto" />
            <h3 className="mt-4 text-xl font-semibold text-slate-600">
              No employees found
            </h3>
            <p className="mt-2 text-slate-400">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/50">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Position
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Branch
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="transition hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              employee.avatar ||
                              `https://ui-avatars.com/api/?name=${employee.name.replace(" ", "+")}&background=6366f1&color=fff&size=128`
                            }
                            alt={employee.name}
                            className="h-10 w-10 rounded-xl object-cover"
                          />
                          <div>
                            <p className="font-medium text-slate-900">
                              {employee.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              ID: {employee.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Mail size={14} className="text-slate-400" />
                            <span>{employee.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Phone size={14} className="text-slate-400" />
                            <span>{employee.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">
                          {employee.position}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <MapPin size={14} className="text-slate-400" />
                          <span>{employee.branch}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(employee.role)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(employee.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => handleView(employee)}
                            className="rounded-xl bg-slate-100 p-2 transition hover:bg-slate-200"
                          >
                            <Eye size={16} className="text-slate-600" />
                          </button>
                          <button className="rounded-xl bg-blue-100 p-2 text-blue-600 transition hover:bg-blue-200">
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(employee.id, employee.name)
                            }
                            className="rounded-xl bg-red-100 p-2 text-red-600 transition hover:bg-red-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Add New Employee
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
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative">
                  <div className="h-24 w-24 rounded-2xl overflow-hidden bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center border-2 border-dashed border-slate-300">
                    {formData.avatarPreview ? (
                      <img
                        src={formData.avatarPreview}
                        alt="Avatar Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={32} className="text-slate-400" />
                    )}
                  </div>
                  {formData.avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-1 -right-1 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600 transition"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Profile Image
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
                    >
                      <Upload size={16} />
                      Choose Image
                    </label>
                    <p className="text-xs text-slate-400 self-center">
                      Max 5MB • JPG, PNG, GIF, WebP
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Phone Number <span className="text-red-500">*</span>
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
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  >
                    <option value="">Select Position</option>
                    {positions.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
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
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
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
                  className="flex-1 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 py-3 font-medium text-white transition hover:scale-105 active:scale-95"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {isViewModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Employee Details
              </h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="rounded-lg p-2 transition hover:bg-slate-100"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Employee Details */}
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={
                    selectedEmployee.avatar ||
                    `https://ui-avatars.com/api/?name=${selectedEmployee.name.replace(" ", "+")}&background=6366f1&color=fff&size=128`
                  }
                  alt={selectedEmployee.name}
                  className="h-20 w-20 rounded-2xl object-cover shadow-lg"
                />
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {selectedEmployee.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(selectedEmployee.role)}
                    {getStatusBadge(selectedEmployee.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={18} className="text-slate-400" />
                    <span className="text-slate-600">
                      {selectedEmployee.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={18} className="text-slate-400" />
                    <span className="text-slate-600">
                      {selectedEmployee.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase size={18} className="text-slate-400" />
                    <span className="text-slate-600">
                      {selectedEmployee.position}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin size={18} className="text-slate-400" />
                    <span className="text-slate-600">
                      {selectedEmployee.branch}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Shield size={18} className="text-slate-400" />
                    <span className="text-slate-600">
                      {selectedEmployee.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={18} className="text-slate-400" />
                    <span className="text-slate-600">
                      Joined:{" "}
                      {new Date(selectedEmployee.joinDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
                <button className="flex-1 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 py-3 font-medium text-white transition hover:scale-105 active:scale-95">
                  Edit Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
