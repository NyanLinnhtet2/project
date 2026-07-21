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
  getManagersForDropdown,
} from "../controllers/user";
import {
  requestEmployeeStatusChange,
  getEmployeeStatusChangeRequests,
  approveEmployeeStatusChangeRequest,
  rejectEmployeeStatusChangeRequest,
} from "../controllers/employeeStatusRequest";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.get("/", authMiddleware, allowRoles("admin", "manager"), getEmployees);
router.get(
  "/stats",
  authMiddleware,
  allowRoles("admin", "manager"),
  getEmployeeStats,
);

router.get(
  "/managers",
  authMiddleware,
  allowRoles("admin"),
  getManagersForDropdown,
);

router.post(
  "/status-request",
  authMiddleware,
  allowRoles("manager", "admin"),
  requestEmployeeStatusChange,
);
router.get(
  "/status-requests",
  authMiddleware,
  allowRoles("admin", "manager"),
  getEmployeeStatusChangeRequests,
);
router.post(
  "/status-request/:id/approve",
  authMiddleware,
  allowRoles("admin"),
  approveEmployeeStatusChangeRequest,
);
router.post(
  "/status-request/:id/reject",
  authMiddleware,
  allowRoles("admin"),
  rejectEmployeeStatusChangeRequest,
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
