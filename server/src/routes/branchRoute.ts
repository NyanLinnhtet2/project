// src/routes/branchRoutes.ts
import express from "express";
import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  getBranchStats,
  updateBranchStatus,
  getBranchesForDropdown
} from "../controllers/branch";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";



const router = express.Router();

// Public routes (Admin only)
router.get("/", authMiddleware, allowRoles("admin"), getBranches);
router.get("/stats", authMiddleware, allowRoles("admin"), getBranchStats);
router.get(
  "/dropdown",
  authMiddleware,
  allowRoles("admin", "manager"),
  getBranchesForDropdown,
);

router.get("/:id", authMiddleware, allowRoles("admin"), getBranchById);

// Admin only routes
router.post("/create-branch", authMiddleware, allowRoles("admin"), createBranch);
router.put("/update-branch/:id", authMiddleware, allowRoles("admin"), updateBranch);
router.delete("/:id", authMiddleware, allowRoles("admin"), deleteBranch);
router.patch(
  "/:id/status",
  authMiddleware,
  allowRoles("admin"),
  updateBranchStatus,
);

export default router;
