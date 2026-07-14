// src/routes/brandRoutes.ts
import express from "express";
import {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandStats,
  getBrandsWithCount,
} from "../controllers/brand";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.get("/", authMiddleware, allowRoles("admin", "manager"), getBrands);
router.get(
  "/stats",
  authMiddleware,
  allowRoles("admin", "manager"),
  getBrandStats,
);
router.get(
  "/with-count",
  authMiddleware,
  allowRoles("admin", "manager"),
  getBrandsWithCount,
);
router.get(
  "/:id",
  authMiddleware,
  allowRoles("admin", "manager"),
  getBrandById,
);
router.post("/create", authMiddleware, allowRoles("admin"), createBrand);
router.put("/:id", authMiddleware, allowRoles("admin"), updateBrand);
router.delete("/:id", authMiddleware, allowRoles("admin"), deleteBrand);

export default router;
