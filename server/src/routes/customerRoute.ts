import express from "express";
import {
  createCustomer,
  searchCustomers,
  listCustomers,
  getCustomerProfile,
  updateCustomer,
} from "../controllers/customer";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.post("/", authMiddleware, allowRoles("cashier", "manager", "admin"), createCustomer);
router.get("/search", authMiddleware, allowRoles("cashier", "manager", "admin"), searchCustomers);
router.get("/", authMiddleware, allowRoles("manager", "admin"), listCustomers);
router.get("/:id", authMiddleware, allowRoles("cashier", "manager", "admin"), getCustomerProfile);
router.patch("/:id", authMiddleware, allowRoles("manager", "admin"), updateCustomer);

export default router;