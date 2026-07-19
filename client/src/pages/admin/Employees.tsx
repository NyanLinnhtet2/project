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
  Shield,
  Briefcase,
  Clock,
  Upload,
  Image as ImageIcon,
  Loader2,
  DollarSign,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import {
  getEmployeesApi,
  createEmployeeApi,
  updateEmployeeApi,
  deleteEmployeeApi,
  getEmployeeStatsApi,
} from "../../services/employeeServices";
import { getBranchesForDropdownApi } from "../../services/branchService";
import toast from "react-hot-toast";
import type {
  Employee,
  CreateEmployeeData,
  UpdateEmployeeData,
} from "../../types/employee";
import { validateImageFile, compressImage } from "../../utils/imageCompressing";
import axios from "axios";
import type { ErrorResponse } from "../../types/ErrorResponse";
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
}

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "danger",
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: "text-red-600",
          button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
        };
      case "warning":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          icon: "text-amber-600",
          button: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
        };
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: "text-blue-600",
          button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl ${styles.bg} p-6 shadow-2xl border ${styles.border}`}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`rounded-full p-3 ${styles.bg}`}>
            <AlertCircle size={32} className={styles.icon} />
          </div>
        </div>

        {/* Title & Message */}
        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-600 text-center mb-6">{message}</p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 font-medium text-white transition hover:scale-105 active:scale-95 ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

interface Branch {
  _id: string;
  name: string;
  code: string;
  status: string;
}

interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  position: string;
  branch: string;
  role: "admin" | "manager" | "cashier";
  status: "active" | "inactive" | "suspended";
  password: string;
  salary: string;
  avatar: File | null;
  avatarPreview: string;
}

// Sort types
type SortField =
  | "name"
  | "email"
  | "position"
  | "branch"
  | "salary"
  | "role"
  | "status"
  | "joinDate";
type SortOrder = "asc" | "desc";

export const Employees = () => {
  // States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFetchingBranches, setIsFetchingBranches] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const [sortField, setSortField] = useState<SortField>("joinDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    totalSalary: 0,
    roles: {
      admin: 0,
      manager: 0,
      cashier: 0,
    },
  });
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
    salary: "",
    avatar: null,
    avatarPreview: "",
  });

  // Positions list
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
      value: "suspended",
      label: "Suspended",
      color: "bg-amber-100 text-amber-700",
    },
  ];

  useEffect(() => {
    let filtered = [...employees];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(term) ||
          emp.email.toLowerCase().includes(term) ||
          emp.position.toLowerCase().includes(term) ||
          emp.branch.toLowerCase().includes(term),
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (emp) => emp.status === statusFilter.toLowerCase(),
      );
    }

    // ✅ Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField as keyof Employee];
      let bValue = b[sortField as keyof Employee];

      // Handle string comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Handle null/undefined values
      if (aValue == null) aValue = "";
      if (bValue == null) bValue = "";

      // For salary (number)
      if (sortField === "salary") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const t = setTimeout(() => {
      setFilteredEmployees(filtered);
    }, 0);

    return () => clearTimeout(t);
  }, [searchTerm, statusFilter, employees, sortField, sortOrder]);

  const fetchBranches = async () => {
    try {
      setIsFetchingBranches(true);
      const response = await getBranchesForDropdownApi();
      if (response.success) {
        const activeBranches = response.data.filter(
          (branch: Branch) => branch.status === "active",
        );
        setBranches(activeBranches);
      } else {
        console.error("Failed to fetch branches:", response.message);
      }
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;

      toast.error(message ?? "Something went wrong");
    } finally {
      setIsFetchingBranches(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getEmployeesApi();
      if (response.success) {
        setEmployees(response.data);
        setFilteredEmployees(response.data);
      } else {
        setError(response.message || "Failed to fetch employees");
        toast.error(response.message || "Failed to fetch employees");
      }
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;
      setError(`${message}`);
      toast.error(message ?? "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getEmployeeStatsApi();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;

      toast.error(message ?? "Something went wrong");
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchEmployees();
      fetchStats();
      fetchBranches();
    }, 0);

    return () => clearTimeout(t);
  }, []);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.message || "Invalid image file");
      return;
    }

    try {
      toast.loading("Compressing image...");
      const compressedImage = await compressImage(file, 5);
      toast.dismiss();

      setFormData((prev) => ({
        ...prev,
        avatar: file,
        avatarPreview: compressedImage,
      }));

      toast.success("Image uploaded successfully!");
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;

      toast.error(message ?? "Something went wrong");
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

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      position: "",
      branch: "",
      role: "cashier",
      status: "active",
      password: "",
      salary: "",
      avatar: null,
      avatarPreview: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.position ||
      !formData.branch ||
      !formData.password
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);

      let avatarBase64 = "";
      if (formData.avatar) {
        const reader = new FileReader();
        avatarBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(formData.avatar as File);
        });
      }

      const employeeData: CreateEmployeeData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        branch: formData.branch,
        role: formData.role,
        status: formData.status,
        password: formData.password,
        salary: Number(formData.salary) || 0,
        avatar: avatarBase64 || undefined,
      };

      const response = await createEmployeeApi(employeeData);

      if (response.success) {
        toast.success(response.message || "Employee created successfully!");
        setIsModalOpen(false);
        resetForm();
        await fetchEmployees();
        await fetchStats();
      } else {
        toast.error(response.message || "Failed to create employee");
      }
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;

      toast.error(message ?? "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingEmployee) return;

    try {
      setIsSubmitting(true);

      let avatarBase64 = "";
      if (formData.avatar) {
        const reader = new FileReader();
        avatarBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(formData.avatar as File);
        });
      }

      const updateData: UpdateEmployeeData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        branch: formData.branch,
        role: formData.role,
        status: formData.status,
        salary: Number(formData.salary) || 0,
        avatar: avatarBase64 || undefined,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await updateEmployeeApi(editingEmployee._id, updateData);

      if (response.success) {
        toast.success(response.message || "Employee updated successfully!");
        setIsEditModalOpen(false);
        setEditingEmployee(null);
        resetForm();
        await fetchEmployees();
        await fetchStats();
      } else {
        toast.error(response.message || "Failed to update employee");
      }
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;

      toast.error(message ?? "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const response = await deleteEmployeeApi(deleteTarget.id);
      if (response.success) {
        toast.success(response.message || "Employee deleted successfully!");
        await fetchEmployees();
        await fetchStats();
      } else {
        toast.error(response.message || "Failed to delete employee");
      }
    } catch (error: unknown) {
      const message = axios.isAxiosError<ErrorResponse>(error)
        ? error.response?.data.message
        : undefined;

      toast.error(message ?? "Something went wrong");
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      branch: employee.branch,
      role: employee.role,
      status: employee.status,
      password: "",
      salary: employee.salary?.toString() || "",
      avatar: null,
      avatarPreview: employee.image?.url || "",
    });
    setIsEditModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
      inactive: { label: "Inactive", className: "bg-red-100 text-red-700" },
      suspended: {
        label: "Suspended",
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

  const formatCurrency = (amount: number) => {
    if (!amount) return "0 MMK";
    return new Intl.NumberFormat("my-MM", {
      style: "currency",
      currency: "MMK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h3 className="mt-4 text-xl font-semibold text-slate-900">
            Error Loading Employees
          </h3>
          <p className="mt-2 text-slate-600">{error}</p>
          <button
            onClick={fetchEmployees}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Main Render
  // ============================================================
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/50 p-6">
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Employee"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="danger"
      />

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

          <div className="flex gap-3">
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
            >
              <UserPlus size={20} />
              Add New Employee
            </button>
          </div>
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
                {stats.total > 0
                  ? Math.round((stats.active / stats.total) * 100)
                  : 0}
                % of total
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Salary
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {formatCurrency(stats.totalSalary)}
                </p>
              </div>
              <div className="rounded-xl bg-violet-50 p-3">
                <DollarSign size={20} className="text-violet-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-blue-600">
              <span>↑ 12%</span>
              <span className="text-slate-400">this quarter</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Suspended</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {stats.suspended}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <Clock size={20} className="text-amber-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle size={12} />
              <span className="text-slate-400">Needs review</span>
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
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>

            {/* ✅ Sorting Dropdown */}
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="position">Sort by Position</option>
              <option value="branch">Sort by Branch</option>
              <option value="salary">Sort by Salary</option>
              <option value="role">Sort by Role</option>
              <option value="status">Sort by Status</option>
              <option value="joinDate">Sort by Join Date</option>
            </select>

            {/* ✅ Sort Order Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:border-blue-500 focus:bg-white"
            >
              {sortOrder === "asc" ? (
                <>
                  <SortAsc size={16} />
                  Asc
                </>
              ) : (
                <>
                  <SortDesc size={16} />
                  Desc
                </>
              )}
            </button>
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
                      Salary
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
                      key={employee._id}
                      className="transition hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              employee.image?.url ||
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
                              ID: {employee._id.slice(-6)}
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
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(employee.salary || 0)}
                        </p>
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
                          <button
                            onClick={() => handleEdit(employee)}
                            className="rounded-xl bg-blue-100 p-2 text-blue-600 transition hover:bg-blue-200"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteClick(employee._id, employee.name)
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

      {/* ============================================================
          Add Employee Modal
          ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Add New Employee
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="rounded-lg p-2 transition hover:bg-slate-100"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

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
                    {isFetchingBranches ? (
                      <option value="" disabled>
                        Loading branches...
                      </option>
                    ) : (
                      branches.map((branch) => (
                        <option key={branch._id} value={branch.name}>
                          {branch.name} ({branch.code})
                        </option>
                      ))
                    )}
                  </select>
                  {!isFetchingBranches && branches.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No active branches found. Please create a branch first.
                    </p>
                  )}
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

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Salary (MMK)
                </label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  placeholder="Enter salary amount"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 py-3 font-medium text-white transition hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Add Employee"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          Edit Employee Modal
          ============================================================ */}
      {isEditModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Edit Employee
              </h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingEmployee(null);
                  resetForm();
                }}
                className="rounded-lg p-2 transition hover:bg-slate-100"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-6 space-y-4">
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
                      id="avatar-upload-edit"
                    />
                    <label
                      htmlFor="avatar-upload-edit"
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
                    >
                      <Upload size={16} />
                      Change Image
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
                    Password (Leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
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
                    {isFetchingBranches ? (
                      <option value="" disabled>
                        Loading branches...
                      </option>
                    ) : (
                      branches.map((branch) => (
                        <option key={branch._id} value={branch.name}>
                          {branch.name} ({branch.code})
                        </option>
                      ))
                    )}
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

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Salary (MMK)
                </label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  placeholder="Enter salary amount"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingEmployee(null);
                    resetForm();
                  }}
                  className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 py-3 font-medium text-white transition hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    "Update Employee"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          View Employee Modal
          ============================================================ */}
      {isViewModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
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

            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={
                    selectedEmployee.image?.url ||
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
                  <div className="flex items-center gap-3 text-sm">
                    <DollarSign size={18} className="text-slate-400" />
                    <span className="text-slate-600 font-semibold">
                      {formatCurrency(selectedEmployee.salary || 0)}
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
                    <span className="text-slate-600 capitalize">
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
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleEdit(selectedEmployee);
                  }}
                  className="flex-1 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 py-3 font-medium text-white transition hover:scale-105 active:scale-95"
                >
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
