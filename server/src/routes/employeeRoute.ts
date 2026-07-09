// src/routes/employeeRoutes.ts
import express from "express";
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  getEmployeesByBranch,
  updateEmployeeStatus,
} from "../controllers/user";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import { getBranchesForDropdown } from "../controllers/branch";

const router = express.Router();

// Public routes (Admin & Manager can view)
router.get("/", authMiddleware, allowRoles("admin", "manager"), getEmployees);
router.get(
  "/stats",
  authMiddleware,
  allowRoles("admin", "manager"),
  getEmployeeStats,
);

router.get(
  "/dropdown",
  authMiddleware,
  allowRoles("admin", "manager"),
  getBranchesForDropdown,
);
router.get(
  "/branch/:branchName",
  authMiddleware,
  allowRoles("admin", "manager"),
  getEmployeesByBranch,
);
router.get(
  "/:id",
  authMiddleware,
  allowRoles("admin", "manager"),
  getEmployeeById,
);

// Admin only routes
router.post("/create", authMiddleware, allowRoles("admin"), createEmployee);
router.put("/:id", authMiddleware, allowRoles("admin"), updateEmployee);
router.delete("/:id", authMiddleware, allowRoles("admin"), deleteEmployee);
router.patch(
  "/:id/status",
  authMiddleware,
  allowRoles("admin"),
  updateEmployeeStatus,
);

export default router;
