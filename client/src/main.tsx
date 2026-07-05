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
import { ProtectedRoute } from "./routes/ProtectRoute";

const router = createBrowserRouter([
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

  {
    path: "/admin/*",
    element: <AdminLayout />,
    children: [
      {
        path: "overviews",
        element: (
          <ProtectedRoute
            allowedRoles={["superadmin", "admin", "branch_admin"]}
          >
            <Overview />
          </ProtectedRoute>
        ),
      },
      {
        path: "branches",
        element: (
          <ProtectedRoute
            allowedRoles={["superadmin", "admin", "branch_admin"]}
          >
            <Branch />
          </ProtectedRoute>
        ),
      },
      {
        path: "products",
        element: (
          <ProtectedRoute
            allowedRoles={["superadmin", "admin", "branch_admin"]}
          >
            <Product />
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
            <div>Admin Settings Page</div>
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
    <RouterProvider router={router} />
  </StrictMode>,
);
