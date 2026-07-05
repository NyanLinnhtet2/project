import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.post("/", authMiddleware, allowRoles("admin"), createProduct);

router.get("/", authMiddleware, getAllProducts);

router.get("/:id", authMiddleware, getProductById);

router.put("/:id", authMiddleware, allowRoles("admin"), updateProduct);

router.delete("/:id", authMiddleware, allowRoles("admin"), deleteProduct);

export default router;
