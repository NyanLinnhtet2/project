// src/pages/admin/CategoryBrand.tsx
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Tag,
  Layers,
  AlertCircle,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Package,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  getCategoriesWithCountApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  getCategoryStatsApi,
} from "../../services/categoryService";
import {
  getBrandsWithCountApi,
  createBrandApi,
  updateBrandApi,
  deleteBrandApi,
  getBrandStatsApi,
} from "../../services/brandService";
import toast from "react-hot-toast";
import type { Category } from "../../types/category";
import type { Brand } from "../../types/brand";

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
// Main Component
// ============================================================
export const CategoryBrand = () => {
  // States
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<"categories" | "brands">(
    "categories",
  );

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Category | Brand | null>(null);
  const [modalType, setModalType] = useState<"category" | "brand">("category");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: "category" | "brand";
  } | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    status: "active" | "inactive";
  }>({
    name: "",
    description: "",
    status: "active",
  });

  // Stats
  const [categoryStats, setCategoryStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [brandStats, setBrandStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // ============================================================
  // Fetch Functions
  // ============================================================
  const fetchCategories = async () => {
    try {
      const params: any = {};
      if (statusFilter !== "All") params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      // ✅ Use the new API with product count
      const response = await getCategoriesWithCountApi(params);
      if (response.success) {
        setCategories(response.data);
        setFilteredCategories(response.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchBrands = async () => {
    try {
      const params: any = {};
      if (statusFilter !== "All") params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      // ✅ Use the new API with product count
      const response = await getBrandsWithCountApi(params);
      if (response.success) {
        setBrands(response.data);
        setFilteredBrands(response.data);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const [catStats, brandStats] = await Promise.all([
        getCategoryStatsApi(),
        getBrandStatsApi(),
      ]);
      if (catStats.success) setCategoryStats(catStats.data);
      if (brandStats.success) setBrandStats(brandStats.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchCategories(), fetchBrands(), fetchStats()]);
    } catch (error) {
      setError(`${(error as { data: { message: string } }).data.message}`);
      toast.error(`${(error as { data: { message: string } }).data.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchAll();
    }, 0);

    return () => clearTimeout(t);
  }, []);

  // Filter on search/status change
  useEffect(() => {
    let filtered = [...categories];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(term));
    }
    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (c) => c.status === statusFilter.toLowerCase(),
      );
    }
    const t = setTimeout(() => {
      setFilteredCategories(filtered);
    }, 0);

    return () => clearTimeout(t);
  }, [searchTerm, statusFilter, categories]);

  useEffect(() => {
    let filtered = [...brands];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((b) => b.name.toLowerCase().includes(term));
    }
    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (b) => b.status === statusFilter.toLowerCase(),
      );
    }

    const t = setTimeout(() => {
      setFilteredBrands(filtered);
    }, 0);

    return () => clearTimeout(t);
  }, [searchTerm, statusFilter, brands]);

  // ============================================================
  // Handlers
  // ============================================================
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

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "active",
    });
    setEditingItem(null);
  };

  const handleOpenModal = (
    type: "category" | "brand",
    item?: Category | Brand,
  ) => {
    setModalType(type);
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || "",
        status: item.status,
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingItem) {
        // Update
        let response;
        if (modalType === "category") {
          response = await updateCategoryApi(editingItem._id, formData);
        } else {
          response = await updateBrandApi(editingItem._id, formData);
        }
        if (response.success) {
          toast.success(
            response.message || `${modalType} updated successfully`,
          );
          await fetchAll();
          handleCloseModal();
        }
      } else {
        // Create
        let response;
        if (modalType === "category") {
          response = await createCategoryApi(formData);
        } else {
          response = await createBrandApi(formData);
        }
        if (response.success) {
          toast.success(
            response.message || `${modalType} created successfully`,
          );
          await fetchAll();
          handleCloseModal();
        }
      }
    } catch (error) {
      toast.error(`${(error as { data: { message: string } }).data.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (
    id: string,
    name: string,
    type: "category" | "brand",
  ) => {
    setDeleteTarget({ id, name, type });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      let response;
      if (deleteTarget.type === "category") {
        response = await deleteCategoryApi(deleteTarget.id);
      } else {
        response = await deleteBrandApi(deleteTarget.id);
      }
      if (response.success) {
        toast.success(
          response.message || `${deleteTarget.type} deleted successfully`,
        );
        await fetchAll();
      } else {
        toast.error(
          response.message || `Failed to delete ${deleteTarget.type}`,
        );
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

  // ============================================================
  // Loading & Error States
  // ============================================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading...</p>
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
            Error Loading Data
          </h3>
          <p className="mt-2 text-slate-600">{error}</p>
          <button
            onClick={fetchAll}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentData =
    activeTab === "categories" ? filteredCategories : filteredBrands;
  const currentStats = activeTab === "categories" ? categoryStats : brandStats;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/50 p-6">
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={`Delete ${deleteTarget?.type}`}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText={
          isDeleting ? "Deleting..." : `Delete ${deleteTarget?.type}`
        }
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="danger"
        isLoading={isDeleting}
      />

      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
                <Layers size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Category & Brand Management
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Manage your product categories and brands
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              handleOpenModal(activeTab === "categories" ? "category" : "brand")
            }
            className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
          >
            <Plus size={20} />
            Add New {activeTab === "categories" ? "Category" : "Brand"}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {currentStats.total}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <Layers size={20} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {currentStats.active}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Inactive</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {currentStats.inactive}
                </p>
              </div>
              <div className="rounded-xl bg-red-50 p-3">
                <AlertCircle size={20} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 rounded-2xl bg-white p-2 shadow-sm">
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex-1 rounded-xl px-6 py-3 font-medium transition ${
              activeTab === "categories"
                ? "bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Tag size={18} />
              Categories
              <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {categoryStats.total}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("brands")}
            className={`flex-1 rounded-xl px-6 py-3 font-medium transition ${
              activeTab === "brands"
                ? "bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Layers size={18} />
              Brands
              <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {brandStats.total}
              </span>
            </div>
          </button>
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
              placeholder={`Search ${activeTab}...`}
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
          </div>
        </div>

        {/* List with Product Count */}
        {currentData.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <Tag className="h-16 w-16 text-slate-300 mx-auto" />
            <h3 className="mt-4 text-xl font-semibold text-slate-600">
              No {activeTab} found
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
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Products
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Created At
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentData.map((item) => (
                    <tr
                      key={item._id}
                      className="transition hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-md">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {item.description || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Package size={14} className="text-slate-400" />
                          <span className="font-medium text-slate-900">
                            {item.productCount || 0}
                          </span>
                          <span className="text-xs text-slate-400">
                            product{item.productCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() =>
                              handleOpenModal(
                                activeTab === "categories"
                                  ? "category"
                                  : "brand",
                                item,
                              )
                            }
                            className="rounded-xl bg-blue-100 p-2 text-blue-600 transition hover:bg-blue-200"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteClick(
                                item._id,
                                item.name,
                                activeTab === "categories"
                                  ? "category"
                                  : "brand",
                              )
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

      {/* Add/Edit Modal - Same as before */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {editingItem ? "Edit" : "Add New"} {modalType}
              </h2>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-2 transition hover:bg-slate-100"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={`Enter ${modalType} name`}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder={`Enter ${modalType} description`}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
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
                      Saving...
                    </span>
                  ) : editingItem ? (
                    "Update"
                  ) : (
                    "Create"
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
