import express from "express";
import { getReportSummary } from "../controllers/report";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.get("/summary", authMiddleware, allowRoles("manager", "admin"), getReportSummary);

export default router;