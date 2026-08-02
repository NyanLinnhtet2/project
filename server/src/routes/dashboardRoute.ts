import express from "express";
import { getDashboardOverview } from "../controllers/dashboard";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.get("/overview", authMiddleware, allowRoles("manager", "admin"), getDashboardOverview);

export default router;