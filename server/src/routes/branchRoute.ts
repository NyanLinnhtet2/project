import express from "express";
import { createBranch } from "../controllers/branch";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.post(
  "/create-branch",
  authMiddleware,
  allowRoles("admin"),
  createBranch,
);

export default router;
