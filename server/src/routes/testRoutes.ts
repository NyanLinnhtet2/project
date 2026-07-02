import express from "express";
import {
  seedBranchStock,
  createOrderWorkflowTest,
} from "../controllers/testController";
import { login } from "../controllers/auth";

const router = express.Router();

router.post("/seed-stock", seedBranchStock);
router.post("/login", login);

export default router;
