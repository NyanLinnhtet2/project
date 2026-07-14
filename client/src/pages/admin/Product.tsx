import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  Package,
  Tag,
  DollarSign,
  Layers,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Grid3x3,
  List,
  CalendarIcon,
  Loader2,
  SortAsc,
  SortDesc,
  AlertTriangle,
  Store,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  getProductsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  getProductStatsApi,
} from "../../services/productService";
import { getCategoriesApi } from "../../services/categoryService";
import { getBrandsApi } from "../../services/brandService";
import { getBranchesForDropdownApi } from "../../services/branchService";
import { validateImageFile, compressImage } from "../../utils/imageCompressing";
import toast from "react-hot-toast";
import type {
  Product as Products,
  CreateProductData,
  UpdateProductData,
} from "../../types/product";

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
// View Product Modal
// ============================================================
interface ViewProductModalProps {
  isOpen: boolean;
  product: Products | null;
  onClose: () => void;
  onEdit: () => void;
}

const ViewProductModal = ({
  isOpen,
  product,
  onClose,
  onEdit,
}: ViewProductModalProps) => {
  if (!isOpen || !product) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("my-MM", {
      style: "currency",
      currency: "MMK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
      inactive: { label: "Inactive", className: "bg-red-100 text-red-700" },
      "out-of-stock": {
        label: "Out of Stock",
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-linear-to-br from-blue-600 to-blue-700 p-2 shadow-lg shadow-blue-200">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {product.name}
              </h2>
              <p className="text-sm text-slate-500">Product Details</p>
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
            {getStatusBadge(product.status)}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              SKU: {product.sku}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              {product.brand}
            </span>
          </div>

          <div className="flex items-start gap-6">
            <img
              src={
                product.image?.url ||
                "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400"
              }
              alt={product.name}
              className="h-48 w-48 rounded-2xl object-cover shadow-lg"
            />
            <div className="flex-1">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Tag size={18} className="text-slate-400" />
                    <span className="text-slate-600">{product.category}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Store size={18} className="text-slate-400" />
                    <span className="text-slate-600">
                      Shop: {product.shopName || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <DollarSign size={18} className="text-slate-400" />
                    <span className="font-semibold text-slate-900">
                      Price: {formatCurrency(product.price)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <DollarSign size={18} className="text-slate-400" />
                    <span className="text-slate-600">
                      Cost: {formatCurrency(product.cost || 0)}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Package size={18} className="text-slate-400" />
                    <span className="text-slate-600">
                      Stock: {product.stock || 0} {product.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Layers size={18} className="text-slate-400" />
                    <span className="text-slate-600">{product.branch}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CalendarIcon size={18} className="text-slate-400" />
                    <span className="text-slate-600">
                      Added: {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {product.description && (
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-semibold text-slate-700">
                Description
              </h4>
              <p className="mt-1 text-sm text-slate-600">
                {product.description}
              </p>
            </div>
          )}

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
              Edit Product
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
interface Branch {
  _id: string;
  name: string;
  code: string;
  status: string;
}

interface Category {
  _id: string;
  name: string;
  status: string;
}

interface Brand {
  _id: string;
  name: string;
  status: string;
}

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  brand: string;
  shopName: string; // ✅ Added shopName
  price: string;
  cost: string;
  stock: string;
  unit: string;
  description: string;
  status: "active" | "inactive" | "out-of-stock";
  branch: string;
  image: File | null;
  imagePreview: string;
}

type SortField =
  | "name"
  | "sku"
  | "category"
  | "brand"
  | "shopName"
  | "price"
  | "stock"
  | "status"
  | "createdAt";
type SortOrder = "asc" | "desc";

export const Product = () => {
  // States
  const [products, setProducts] = useState<Products[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Products[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isFetchingBranches, setIsFetchingBranches] = useState<boolean>(false);
  const [isFetchingCategories, setIsFetchingCategories] =
    useState<boolean>(false);
  const [isFetchingBrands, setIsFetchingBrands] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);
  const [editingProduct, setEditingProduct] = useState<Products | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortField, setSortField] = useState<SortField>("createdAt");
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
    outOfStock: 0,
    totalValue: 0,
    branches: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    sku: "",
    category: "",
    brand: "",
    shopName: "", // ✅ Added shopName
    price: "",
    cost: "",
    stock: "",
    unit: "pcs",
    description: "",
    status: "active",
    branch: "",
    image: null,
    imagePreview: "",
  });

  const units = ["pcs", "pairs", "sets", "boxes", "dozens"];

  // ============================================================
  // API Functions
  // ============================================================
  const fetchBranches = async () => {
    try {
      setIsFetchingBranches(true);
      const response = await getBranchesForDropdownApi();
      if (response.success) {
        const activeBranches = response.data.filter(
          (branch: Branch) => branch.status === "active",
        );
        setBranches(activeBranches);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Failed to load branches");
    } finally {
      setIsFetchingBranches(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setIsFetchingCategories(true);
      const response = await getCategoriesApi();
      if (response.success) {
        const activeCategories = response.data.filter(
          (cat: Category) => cat.status === "active",
        );
        setCategories(activeCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setIsFetchingCategories(false);
    }
  };

  const fetchBrands = async () => {
    try {
      setIsFetchingBrands(true);
      const response = await getBrandsApi();
      if (response.success) {
        const activeBrands = response.data.filter(
          (brand: Brand) => brand.status === "active",
        );
        setBrands(activeBrands);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to load brands");
    } finally {
      setIsFetchingBrands(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {};
      if (statusFilter !== "All") params.status = statusFilter;
      if (categoryFilter !== "All") params.category = categoryFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await getProductsApi(params);

      if (response.success) {
        setProducts(response.data);
        setFilteredProducts(response.data);
      } else {
        setError(response.message || "Failed to fetch products");
        toast.error(response.message || "Failed to fetch products");
      }
    } catch (error) {
      setError(`${(error as { data: { message: string } }).data.message}`);
      toast.error(`${(error as { data: { message: string } }).data.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getProductStatsApi();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  // ============================================================
  // Effects - Using your style with setTimeout
  // ============================================================
  useEffect(() => {
    const t = setTimeout(() => {
      fetchProducts();
      fetchStats();
      fetchBranches();
      fetchCategories();
      fetchBrands();
    }, 0);

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.brand.toLowerCase().includes(term),
      );
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (p) => p.status === statusFilter.toLowerCase(),
      );
    }

    if (categoryFilter !== "All") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField as keyof Products];
      let bValue = b[sortField as keyof Products];

      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue == null) aValue = "";
      if (bValue == null) bValue = "";

      if (sortField === "price" || sortField === "stock") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const t = setTimeout(() => {
      setFilteredProducts(filtered);
    }, 0);

    return () => clearTimeout(t);
  }, [
    searchTerm,
    statusFilter,
    categoryFilter,
    products,
    sortField,
    sortOrder,
  ]);

  // ============================================================
  // Form Handlers
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
        image: file,
        imagePreview: compressedImage,
      }));

      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to process image. Please try again.");
      console.error("Image processing error:", error);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: null,
      imagePreview: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category: "",
      brand: "",
      shopName: "",
      price: "",
      cost: "",
      stock: "",
      unit: "pcs",
      description: "",
      status: "active",
      branch: "",
      image: null,
      imagePreview: "",
    });
  };

  // ============================================================
  // CRUD Handlers
  // ============================================================
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.sku ||
      !formData.category ||
      !formData.brand ||
      !formData.price ||
      !formData.branch
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);

      let avatarBase64 = "";
      if (formData.image) {
        const reader = new FileReader();
        avatarBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(formData.image as File);
        });
      }

      const productData: CreateProductData = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        brand: formData.brand,
        shopName: formData.shopName, // ✅ Added shopName
        price: Number(formData.price),
        cost: Number(formData.cost) || 0,
        stock: Number(formData.stock) || 0,
        unit: formData.unit,
        status: formData.status,
        description: formData.description,
        branch: formData.branch,
        avatar: avatarBase64 || undefined,
      };

      const response = await createProductApi(productData);

      if (response.success) {
        toast.success(response.message || "Product created successfully!");
        setIsModalOpen(false);
        resetForm();
        await fetchProducts();
        await fetchStats();
      } else {
        toast.error(response.message || "Failed to create product");
      }
    } catch (error) {
      toast.error(`${(error as { data: { message: string } }).data.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingProduct) return;

    try {
      setIsSubmitting(true);

      let avatarBase64 = "";
      if (formData.image) {
        const reader = new FileReader();
        avatarBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(formData.image as File);
        });
      }

      const updateData: UpdateProductData = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        brand: formData.brand,
        shopName: formData.shopName, // ✅ Added shopName
        price: Number(formData.price),
        cost: Number(formData.cost) || 0,
        stock: Number(formData.stock) || 0,
        unit: formData.unit,
        status: formData.status,
        description: formData.description,
        branch: formData.branch,
        avatar: avatarBase64 || undefined,
      };

      const response = await updateProductApi(editingProduct._id, updateData);

      if (response.success) {
        toast.success(response.message || "Product updated successfully!");
        setIsEditModalOpen(false);
        setEditingProduct(null);
        resetForm();
        await fetchProducts();
        await fetchStats();
      } else {
        toast.error(response.message || "Failed to update product");
      }
    } catch (error) {
      toast.error(`${(error as { data: { message: string } }).data.message}`);
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
    setIsDeleting(true);

    try {
      const response = await deleteProductApi(deleteTarget.id);
      if (response.success) {
        toast.success(response.message || "Product deleted successfully!");
        await fetchProducts();
        await fetchStats();
      } else {
        toast.error(response.message || "Failed to delete product");
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

  const handleView = (product: Products) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const handleEdit = (product: Products) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      brand: product.brand,
      shopName: product.shopName || "", // ✅ Added shopName
      price: product.price.toString(),
      cost: product.cost?.toString() || "",
      stock: product.stock?.toString() || "0",
      unit: product.unit,
      description: product.description || "",
      status: product.status,
      branch: product.branch,
      image: null,
      imagePreview: product.image?.url || "",
    });
    setIsEditModalOpen(true);
  };

  // ============================================================
  // Helper Functions
  // ============================================================
  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
      inactive: { label: "Inactive", className: "bg-red-100 text-red-700" },
      "out-of-stock": {
        label: "Out of Stock",
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("my-MM", {
      style: "currency",
      currency: "MMK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // ============================================================
  // Loading & Error States
  // ============================================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading products...</p>
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
            Error Loading Products
          </h3>
          <p className="mt-2 text-slate-600">{error}</p>
          <button
            onClick={fetchProducts}
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
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Product"}
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="danger"
        isLoading={isDeleting}
      />

      {/* View Product Modal */}
      <ViewProductModal
        isOpen={isViewModalOpen}
        product={selectedProduct}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedProduct(null);
        }}
        onEdit={() => {
          if (selectedProduct) {
            handleEdit(selectedProduct);
          }
        }}
      />

      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg shadow-blue-200">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Product Management
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Manage your entire product inventory
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
            Add New Product
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Products
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <Package size={20} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active Products
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {stats.active}
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
                <p className="text-sm font-medium text-slate-500">
                  Out of Stock
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {stats.outOfStock}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Value
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {formatCurrency(stats.totalValue)}
                </p>
              </div>
              <div className="rounded-xl bg-violet-50 p-3">
                <DollarSign size={20} className="text-violet-600" />
              </div>
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
              placeholder="Search products by name, SKU, or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="name">Sort by Name</option>
              <option value="sku">Sort by SKU</option>
              <option value="category">Sort by Category</option>
              <option value="brand">Sort by Brand</option>
              <option value="shopName">Sort by Shop</option>
              <option value="price">Sort by Price</option>
              <option value="stock">Sort by Stock</option>
              <option value="status">Sort by Status</option>
              <option value="createdAt">Sort by Date</option>
            </select>
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

        {/* Products Display */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <Package className="h-16 w-16 text-slate-300 mx-auto" />
            <h3 className="mt-4 text-xl font-semibold text-slate-600">
              No products found
            </h3>
            <p className="mt-2 text-slate-400">
              Try adjusting your search or filters
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="group rounded-2xl bg-white shadow-sm overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50"
              >
                <div className="relative h-48 bg-slate-100">
                  <img
                    src={
                      product.image?.url ||
                      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400"
                    }
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(product.status)}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-slate-500">{product.brand}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {formatCurrency(product.price)}
                      </p>
                      <p className="text-xs text-slate-400">
                        SKU: {product.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-600">
                        Stock: {product.stock || 0}
                      </p>
                      <p className="text-xs text-slate-400">{product.unit}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                    <Layers size={14} className="text-slate-400" />
                    <span>{product.category}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                        {product.branch.charAt(0)}
                      </div>
                      <span className="text-xs text-slate-500 truncate max-w-[80px]">
                        {product.branch}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleView(product)}
                        className="rounded-lg bg-slate-100 p-1.5 transition hover:bg-slate-200"
                      >
                        <Eye size={14} className="text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="rounded-lg bg-blue-100 p-1.5 text-blue-600 transition hover:bg-blue-200"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteClick(product._id, product.name)
                        }
                        className="rounded-lg bg-red-100 p-1.5 text-red-600 transition hover:bg-red-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/50">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      SKU
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Stock
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
                  {filteredProducts.map((product) => (
                    <tr
                      key={product._id}
                      className="transition hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              product.image?.url ||
                              "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400"
                            }
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium text-slate-900">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {product.brand}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-slate-600">
                          {product.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(product.price)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm font-medium ${(product.stock || 0) === 0 ? "text-red-600" : "text-slate-600"}`}
                        >
                          {product.stock || 0} {product.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => handleView(product)}
                            className="rounded-lg bg-slate-100 p-1.5 transition hover:bg-slate-200"
                          >
                            <Eye size={14} className="text-slate-600" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="rounded-lg bg-blue-100 p-1.5 text-blue-600 transition hover:bg-blue-200"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteClick(product._id, product.name)
                            }
                            className="rounded-lg bg-red-100 p-1.5 text-red-600 transition hover:bg-red-200"
                          >
                            <Trash2 size={14} />
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

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Add New Product
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
              {/* Image Upload */}
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative">
                  <div className="h-32 w-32 rounded-2xl overflow-hidden bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center border-2 border-dashed border-slate-300">
                    {formData.imagePreview ? (
                      <img
                        src={formData.imagePreview}
                        alt="Product Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={40} className="text-slate-400" />
                    )}
                  </div>
                  {formData.imagePreview && (
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
                    Product Image
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <label
                      htmlFor="product-image-upload"
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
                    >
                      <ImageIcon size={16} />
                      Upload Image
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
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="e.g., PRD-001"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {isFetchingCategories ? (
                      <option value="" disabled>
                        Loading categories...
                      </option>
                    ) : (
                      categories.map((cat) => (
                        <option key={cat._id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                  {!isFetchingCategories && categories.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No active categories found. Please create a category
                      first.
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  >
                    <option value="">Select Brand</option>
                    {isFetchingBrands ? (
                      <option value="" disabled>
                        Loading brands...
                      </option>
                    ) : (
                      brands.map((brand) => (
                        <option key={brand._id} value={brand.name}>
                          {brand.name}
                        </option>
                      ))
                    )}
                  </select>
                  {!isFetchingBrands && brands.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No active brands found. Please create a brand first.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Shop Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                    placeholder="Where did you buy this product?"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Cost
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>
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
                  placeholder="Enter product description"
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
                    "Add Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Edit Product
              </h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="rounded-lg p-2 transition hover:bg-slate-100"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-6 space-y-4">
              {/* Image Upload - Same as Add */}
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative">
                  <div className="h-32 w-32 rounded-2xl overflow-hidden bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center border-2 border-dashed border-slate-300">
                    {formData.imagePreview ? (
                      <img
                        src={formData.imagePreview}
                        alt="Product Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={40} className="text-slate-400" />
                    )}
                  </div>
                  {formData.imagePreview && (
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
                    Product Image
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                      id="product-image-upload-edit"
                    />
                    <label
                      htmlFor="product-image-upload-edit"
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
                    >
                      <ImageIcon size={16} />
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
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="e.g., PRD-001"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {isFetchingCategories ? (
                      <option value="" disabled>
                        Loading categories...
                      </option>
                    ) : (
                      categories.map((cat) => (
                        <option key={cat._id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  >
                    <option value="">Select Brand</option>
                    {isFetchingBrands ? (
                      <option value="" disabled>
                        Loading brands...
                      </option>
                    ) : (
                      brands.map((brand) => (
                        <option key={brand._id} value={brand.name}>
                          {brand.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Shop Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                    placeholder="Where did you buy this product?"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Cost
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>
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
                  placeholder="Enter product description"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingProduct(null);
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
                    "Update Product"
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
