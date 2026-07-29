import express from "express";
import { chatWithAssistant } from "../controllers/aiAssistant";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.post("/chat", authMiddleware, allowRoles("admin"), chatWithAssistant);

export default router;
