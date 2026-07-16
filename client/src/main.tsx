import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Layout from "./layout/Layout";
import "./index.css";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import About from "./pages/About";
import Login from "./pages/Login";
import { AdminLayout } from "./layout/AdminLayout";
import { Overview } from "./pages/admin/Overview";
import { Branch } from "./pages/admin/Branch";
import { Product } from "./pages/admin/Product";
import { CategoryBrand } from "./pages/admin/CategoryBrandManagement";
import { ProtectedRoute } from "./routes/ProtectRoute";
import { Employees } from "./pages/admin/Employees";
import Orders from "./pages/Orders";
import { Toaster } from "react-hot-toast";
import { Inventory } from "./pages/admin/Inventory";
import { AuthProvider } from "./context/AuthProvider";

const router = createBrowserRouter([
  // Public Routes
  {
    path: "/",
    element: <Layout />,

    children: [
      {
        index: true,
        element: <Home />,
      },

      {
        path: "/about",
        element: <About />,
      },

      {
        path: "/login",
        element: <Login />,
      },
    ],
  },

  // Admin Routes
  {
    path: "/admin/*",
    element: <AdminLayout />,
    children: [
      {
        path: "overviews",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Overview />
          </ProtectedRoute>
        ),
      },
      {
        path: "branches",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Branch />
          </ProtectedRoute>
        ),
      },
      {
        path: "products",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Product />
          </ProtectedRoute>
        ),
      },
      {
        path: "inventory",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Inventory />
          </ProtectedRoute>
        ),
      },
      {
        path: "employees",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Employees />
          </ProtectedRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Orders />
          </ProtectedRoute>
        ),
      },

      {
        path: "categoryandbrands",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <CategoryBrand />
          </ProtectedRoute>
        ),
      },
    ],
  },

  {
    path: "*",
    element: <NotFound />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            padding: "20px",
            maxWidth: "800px",
          },
        }}
      />
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
