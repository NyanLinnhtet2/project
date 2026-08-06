import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { resolveReportBranches, collectSalesAndReturns } from "../utils/reportData";
import { getDerivedNotifications } from "../utils/notificationdata";
import { getCentralNotificationModel } from "../models/CentralDB/notification";

interface FeedItem {
  id: string;
  source: "persisted" | "derived";
  type: string;
  severity: "info" | "warning" | "urgent";
  title: string;
  message: string;
  link?: string | undefined;
  read: boolean;
  createdAt: string;
}

const buildFeed = async (req: AuthenticatedRequest): Promise<FeedItem[]> => {
  const role = req.user!.role as "admin" | "manager";
  const branches = await resolveReportBranches(role, req.user!.branch, undefined);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const { sales } = await collectSalesAndReturns(branches, {
    startDate: startOfToday.toISOString(),
  });

  const derived = await getDerivedNotifications(role, branches, sales);
  const derivedItems: FeedItem[] = derived.map((d) => ({
    id: d.id,
    source: "derived",
    type: d.type,
    severity: d.severity,
    title: d.title,
    message: d.message,
    link: d.link,
    read: false, // derived items are always "live" — they vanish once resolved instead of being dismissed
    createdAt: d.createdAt.toISOString(),
  }));

  const Notification = getCentralNotificationModel();
  const persistedFilter: Record<string, unknown> = { recipientRole: role };
  if (role === "manager") {
    persistedFilter.branchId = { $in: branches.map((b) => b._id) };
  }
  const persisted = await Notification.find(persistedFilter).sort({ createdAt: -1 }).limit(50);
  const persistedItems: FeedItem[] = persisted.map((n) => ({
    id: n._id.toString(),
    source: "persisted",
    type: n.type,
    severity: "info",
    title: n.title,
    message: n.message,
    link: n.link,
    read: n.readBy.includes(req.user!.id),
    createdAt: n.createdAt.toISOString(),
  }));

  return [...derivedItems, ...persistedItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

// ============================================================
// GET /api/notifications — Manager: own branch. Admin: everything.
// Merges live-derived "pending action" items with persisted event
// notifications into one feed, newest first.
// ============================================================
export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const feed = await buildFeed(req);
    const unreadCount = feed.filter((f) => !f.read).length;

    return res.status(200).json({ success: true, data: feed, unreadCount });
  } catch (error: any) {
    console.error("❌ Get Notifications Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET /api/notifications/unread-count — lightweight polling target for a
// sidebar badge, without the client needing the full feed every 30s.
// ============================================================
export const getUnreadNotificationCount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const feed = await buildFeed(req);
    const unreadCount = feed.filter((f) => !f.read).length;

    return res.status(200).json({ success: true, unreadCount });
  } catch (error: any) {
    console.error("❌ Get Unread Notification Count Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// PATCH /api/notifications/:id/read — marks one persisted notification
// read for the current user. No-op (but still succeeds) for derived items,
// since their synthetic ids never match a real Notification document.
// ============================================================
export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Notification id is required" });
    }
    const Notification = getCentralNotificationModel();
    await Notification.updateOne({ _id: id }, { $addToSet: { readBy: req.user.id } });
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("❌ Mark Notification Read Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// PATCH /api/notifications/read-all — marks every persisted notification
// in this user's scope as read.
// ============================================================
export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const role = req.user.role as "admin" | "manager";
    const branches = await resolveReportBranches(role, req.user.branch, undefined);

    const Notification = getCentralNotificationModel();
    const filter: Record<string, unknown> = { recipientRole: role };
    if (role === "manager") filter.branchId = { $in: branches.map((b) => b._id) };

    await Notification.updateMany(filter, { $addToSet: { readBy: req.user.id } });
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("❌ Mark All Notifications Read Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};