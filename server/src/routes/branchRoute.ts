import express from "express";
import {
  createBranch,
  updateBranch,
  deleteBranch,
  getAllBranches,
} from "../controllers/branch";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.get("/", getAllBranches);
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
router.delete(
  "/delete-branch/:id",
  authMiddleware,
  allowRoles("admin"),
  deleteBranch,
);

export default router;
