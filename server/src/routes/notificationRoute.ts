import express from "express";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notification";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.get("/", authMiddleware, allowRoles("manager", "admin"), getNotifications);
router.get(
  "/unread-count",
  authMiddleware,
  allowRoles("manager", "admin"),
  getUnreadNotificationCount,
);
router.patch("/read-all", authMiddleware, allowRoles("manager", "admin"), markAllNotificationsRead);
router.patch("/:id/read", authMiddleware, allowRoles("manager", "admin"), markNotificationRead);

export default router;