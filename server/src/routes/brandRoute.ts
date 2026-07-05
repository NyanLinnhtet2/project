import express from "express";
import {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from "../controllers/brand";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.post("/create-brand", authMiddleware, allowRoles("admin"), createBrand);

router.get("/", authMiddleware, getAllBrands);

router.get("/:id", authMiddleware, getBrandById);

router.put(
  "/update-brand/:id",
  authMiddleware,
  allowRoles("admin"),
  updateBrand,
);

router.delete(
  "/delete-brand/:id",
  authMiddleware,
  allowRoles("admin"),
  deleteBrand,
);

export default router;
