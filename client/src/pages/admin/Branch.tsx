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
  Loader2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Package,
  Clock,
  Database,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { useState, useEffect } from "react";
import type {
  Branch as BranchType,
  CreateBranchData,
  UpdateBranchData,
} from "../../types/branch";
import {
  createBranchApi,
  getBranchesApi,
  updateBranchApi,
  deleteBranchApi,
} from "../../services/branchService";
import { getManagersForDropdownApi } from "../../services/employeeServices";
import toast from "react-hot-toast";

// ============================================================
// Confirm Dialog Component
// ============================================================
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
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
  isLoading = false,
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
        <div className="flex justify-center mb-4">
          <div className={`rounded-full p-3 ${styles.bg}`}>
            <AlertTriangle size={32} className={styles.icon} />
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-600 text-center mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-xl px-4 py-2.5 font-medium text-white transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${styles.button}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Deleting...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// View Branch Modal
// ============================================================
interface ViewBranchModalProps {
  isOpen: boolean;
  branch: BranchType | null;
  onClose: () => void;
  onEdit: () => void;
}

const ViewBranchModal = ({
  isOpen,
  branch,
  onClose,
  onEdit,
}: ViewBranchModalProps) => {
  if (!isOpen || !branch) return null;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
          Active
        </span>
      );
    }
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
        Inactive
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-linear-to-br from-blue-600 to-blue-700 p-2 shadow-lg shadow-blue-200">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {branch.name}
              </h2>
              <p className="text-sm text-slate-500">Branch Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-slate-100"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            {getStatusBadge(branch.status)}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              Code: {branch.code}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              Database: {branch.dbName}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Address</p>
                  <p className="text-sm text-slate-600">{branch.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Phone</p>
                  <p className="text-sm text-slate-600">{branch.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Email</p>
                  <p className="text-sm text-slate-600">
                    {branch.email || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Manager</p>
                  <p className="text-sm text-slate-600">
                    {branch.manager || "Not Assigned"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Users size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Employees
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {branch.employeeCount || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Revenue</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(branch.revenue || 0)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Total Orders
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {branch.totalOrders || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Database size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Database</p>
                  <p className="text-sm font-mono text-slate-600">
                    {branch.dbName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Created: {formatDate(branch.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>Last Updated: {formatDate(branch.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="flex-1 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 py-3 font-medium text-white transition hover:scale-105 active:scale-95"
            >
              Edit Branch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
interface Manager {
  _id: string;
  name: string;
  email: string;
  branch: string;
}

// Sort types
type SortField =
  | "name"
  | "code"
  | "status"
  | "createdAt"
  | "employeeCount"
  | "revenue";
type SortOrder = "asc" | "desc";

export const Branch = () => {
  // States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [viewingBranch, setViewingBranch] = useState<BranchType | null>(null);
  const [editingBranch, setEditingBranch] = useState<BranchType | null>(null);
  const [branches, setBranches] = useState<BranchType[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<BranchType[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingManagers, setIsLoadingManagers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // ✅ Sorting states
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalEmployees: 0,
    totalRevenue: 0,
  });

  const [formData, setFormData] = useState<CreateBranchData>({
    name: "",
    code: "",
    phone: "",
    manager: "",
    address: "",
    email: "",
    status: "active",
  });

  // Fetch managers from API
  const fetchManagers = async () => {
    try {
      setIsLoadingManagers(true);
      const response = await getManagersForDropdownApi();
      if (response.success) {
        setManagers(response.data);
      } else {
        console.error("Failed to fetch managers:", response.message);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
    } finally {
      setIsLoadingManagers(false);
    }
  };

  // Fetch branches from API
  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getBranchesApi();

      if (response.success) {
        setBranches(response.data);
        setFilteredBranches(response.data);

        const total = response.data.length;
        const active = response.data.filter(
          (b: BranchType) => b.status === "active",
        ).length;
        const inactive = response.data.filter(
          (b: BranchType) => b.status === "inactive",
        ).length;
        const totalEmployees = response.data.reduce(
          (sum: number, b: BranchType) => sum + (b.employeeCount || 0),
          0,
        );
        const totalRevenue = response.data.reduce(
          (sum: number, b: BranchType) => sum + (b.revenue || 0),
          0,
        );

        setStats({
          total,
          active,
          inactive,
          totalEmployees,
          totalRevenue,
        });
      } else {
        setError(response.message || "Failed to fetch branches");
        toast.error(response.message || "Failed to fetch branches");
      }
    } catch (error) {
      setError(`${(error as { data: { message: string } }).data.message}`);
      toast.error(`${(error as { data: { message: string } }).data.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchBranches();
      fetchManagers();
    }, 0);

    return () => clearTimeout(t);
  }, []);

  // ✅ Apply filters and sorting
  useEffect(() => {
    let filtered = [...branches];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (branch) =>
          branch.name.toLowerCase().includes(term) ||
          branch.code.toLowerCase().includes(term) ||
          branch.manager?.toLowerCase().includes(term),
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (branch) => branch.status === statusFilter.toLowerCase(),
      );
    }

    // ✅ Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField as keyof BranchType];
      let bValue = b[sortField as keyof BranchType];

      // Handle string comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Handle null/undefined values
      if (aValue == null) aValue = "";
      if (bValue == null) bValue = "";

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const t = setTimeout(() => {
      setFilteredBranches(filtered);
    }, 0);

    return () => clearTimeout(t);
  }, [searchTerm, statusFilter, branches, sortField, sortOrder]);

  // Handle form input change
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

  // Handle create branch
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.code ||
      !formData.phone ||
      !formData.address
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await createBranchApi(formData);

      if (response.success) {
        toast.success(response.message || "Branch created successfully!");
        setIsModalOpen(false);
        resetForm();
        await fetchBranches();
        await fetchManagers();
      } else {
        toast.error(response.message || "Failed to create branch");
      }
    } catch (error) {
      toast.error(`${(error as { data: { message: string } }).data.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update branch
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingBranch) return;

    try {
      setIsSubmitting(true);
      const updateData: UpdateBranchData = {
        name: formData.name,
        code: formData.code,
        phone: formData.phone,
        email: formData.email,
        manager: formData.manager,
        address: formData.address,
        status: formData.status,
      };

      const response = await updateBranchApi(editingBranch._id, updateData);

      if (response.success) {
        toast.success(response.message || "Branch updated successfully!");
        setIsEditModalOpen(false);
        setEditingBranch(null);
        resetForm();
        await fetchBranches();
        await fetchManagers();
      } else {
        toast.error(response.message || "Failed to update branch");
      }
    } catch (error) {
      toast.error(`${(error as { data: { message: string } }).data.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete branch - show custom confirmation
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await deleteBranchApi(deleteTarget.id);
      if (response.success) {
        toast.success(response.message || "Branch deleted successfully!");
        await fetchBranches();
        await fetchManagers();
      } else {
        toast.error(response.message || "Failed to delete branch");
      }
    } catch (error) {
      toast.error(`${(error as { data: { message: string } }).data.message}`);
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  // Handle view branch
  const handleView = (branch: BranchType) => {
    setViewingBranch(branch);
    setIsViewModalOpen(true);
  };

  // Handle edit button click
  const handleEdit = (branch: BranchType) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      phone: branch.phone,
      manager: branch.manager || "",
      address: branch.address,
      email: branch.email || "",
      status: branch.status,
    });
    setIsEditModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      phone: "",
      manager: "",
      address: "",
      email: "",
      status: "active",
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          Active
        </span>
      );
    }
    return (
      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        Inactive
      </span>
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading branches...</p>
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
            Error Loading Branches
          </h3>
          <p className="mt-2 text-slate-600">{error}</p>
          <button
            onClick={fetchBranches}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/50 p-6">
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Branch"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete Branch"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="danger"
        isLoading={isDeleting}
      />

      {/* View Branch Modal */}
      <ViewBranchModal
        isOpen={isViewModalOpen}
        branch={viewingBranch}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingBranch(null);
        }}
        onEdit={() => {
          if (viewingBranch) {
            handleEdit(viewingBranch);
          }
        }}
      />

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
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
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
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats.total}
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
              <span>↑ 12%</span>
              <span className="text-slate-400">from last month</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-medium text-slate-500">
              Active Branches
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {stats.active}
            </p>
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
            <p className="text-sm font-medium text-slate-500">
              Total Employees
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats.totalEmployees}
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs text-blue-600">
              <span>↑ 8%</span>
              <span className="text-slate-400">this quarter</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-medium text-slate-500">Revenue</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {formatCurrency(stats.totalRevenue)}
            </p>
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* ✅ Sorting Dropdown */}
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="name">Sort by Name</option>
              <option value="code">Sort by Code</option>
              <option value="status">Sort by Status</option>
              <option value="createdAt">Sort by Date</option>
              <option value="employeeCount">Sort by Employees</option>
              <option value="revenue">Sort by Revenue</option>
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

        {/* Branch Cards Grid */}
        {filteredBranches.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <Building2 className="h-16 w-16 text-slate-300 mx-auto" />
            <h3 className="mt-4 text-xl font-semibold text-slate-600">
              No branches found
            </h3>
            <p className="mt-2 text-slate-400">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredBranches.map((branch) => (
              <div
                key={branch._id}
                className="group rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {branch.name}
                      </h3>
                      {getStatusBadge(branch.status)}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {branch.address}
                    </p>
                  </div>
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
                    <span>Manager: {branch.manager || "Not Assigned"}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Employees</p>
                      <p className="font-semibold text-slate-900">
                        {branch.employeeCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Revenue</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(branch.revenue || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Orders</p>
                      <p className="font-semibold text-slate-900">
                        {branch.totalOrders || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleView(branch)}
                      className="rounded-xl bg-slate-100 p-2 transition hover:bg-slate-200"
                    >
                      <Eye size={16} className="text-slate-600" />
                    </button>
                    <button
                      onClick={() => handleEdit(branch)}
                      className="rounded-xl bg-blue-100 p-2 text-blue-600 transition hover:bg-blue-200"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(branch._id, branch.name)}
                      className="rounded-xl bg-red-100 p-2 text-red-600 transition hover:bg-red-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Add New Branch
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Branch Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter branch name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Branch Code <span className="text-red-500">*</span>
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
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter branch email"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Manager
                  </label>
                  <select
                    name="manager"
                    value={formData.manager}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                  >
                    <option value="">Select Manager</option>
                    {isLoadingManagers ? (
                      <option value="" disabled>
                        Loading managers...
                      </option>
                    ) : (
                      managers.map((manager) => (
                        <option key={manager._id} value={manager.name}>
                          {manager.name} ({manager.branch || "No Branch"})
                        </option>
                      ))
                    )}
                  </select>
                  {!isLoadingManagers && managers.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No managers found. Please create a manager first.
                    </p>
                  )}
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Address <span className="text-red-500">*</span>
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
                    "Add Branch"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {isEditModalOpen && editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">Edit Branch</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingBranch(null);
                  resetForm();
                }}
                className="rounded-lg p-2 transition hover:bg-slate-100"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Branch Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter branch name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Branch Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="e.g., YGN001"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter branch email"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Manager
                  </label>
                  <select
                    name="manager"
                    value={formData.manager}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                  >
                    <option value="">Select Manager</option>
                    {isLoadingManagers ? (
                      <option value="" disabled>
                        Loading managers...
                      </option>
                    ) : (
                      managers.map((manager) => (
                        <option key={manager._id} value={manager.name}>
                          {manager.name} ({manager.branch || "No Branch"})
                        </option>
                      ))
                    )}
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Address <span className="text-red-500">*</span>
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

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingBranch(null);
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
                    "Update Branch"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
