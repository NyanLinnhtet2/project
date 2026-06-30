import express from "express";
import {
  seedBranchStock,
  createOrderWorkflowTest,
} from "../controllers/testController";

const router = express.Router();

router.post("/seed-stock", seedBranchStock);
router.post("/checkout", createOrderWorkflowTest);

export default router;
