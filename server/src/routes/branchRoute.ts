import express from "express";
import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  getBranchStats,
  updateBranchStats,
  getBranchesForDropdown,
} from "../controllers/branch";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.get("/", authMiddleware, allowRoles("admin","manager"), getBranches);
router.get("/stats", authMiddleware, allowRoles("admin","manager"), getBranchStats);
router.get(
  "/dropdown",
  authMiddleware,
  allowRoles("admin", "manager"),
  getBranchesForDropdown,
);

router.get("/:id", authMiddleware, allowRoles("admin"), getBranchById);

router.post(
  "/create-branch",
  authMiddleware,
  allowRoles("admin"),
  createBranch,
);
router.put(
  "/update-branch/:id",
  authMiddleware,
  allowRoles("admin"),
  updateBranch,
);
router.delete("/:id", authMiddleware, allowRoles("admin"), deleteBranch);
router.patch(
  "/:id/status",
  authMiddleware,
  allowRoles("admin"),
  updateBranchStats,
);

export default router;
