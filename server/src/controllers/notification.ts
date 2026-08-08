import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

import {
  resolveReportBranches,
  collectSalesAndReturns,
} from "../utils/reportData";

import { getDerivedNotifications } from "../utils/notificationdata";

import { getCentralNotificationModel } from "../models/CentralDB/notification";

import { getCentralDismissedNotificationModel } from "../models/CentralDB/dismissnotification";

import { getCentralReadNotificationModel } from "../models/CentralDB/readnotification";
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

const isDerivedId = (id: string) => id.includes(":");

const buildFeed = async (req: AuthenticatedRequest): Promise<FeedItem[]> => {
  const role = req.user!.role as "admin" | "manager";

  const branches = await resolveReportBranches(
    role,
    req.user!.branch,
    undefined,
  );

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { sales } = await collectSalesAndReturns(branches, {
    startDate: startOfToday.toISOString(),
  });

  // ============================================================
  // DERIVED NOTIFICATIONS
  // ============================================================

  const derived = await getDerivedNotifications(role, branches, sales);

  // Get derived notification IDs that this user already read
  const ReadNotification = getCentralReadNotificationModel();

  const derivedIds = derived.map((item) => item.id);

  const readDerived = await ReadNotification.find({
    userId: req.user!.id,
    notificationId: { $in: derivedIds },
  }).select("notificationId");

  const readDerivedIds = new Set(
    readDerived.map((item) => item.notificationId),
  );

  const derivedItems: FeedItem[] = derived.map((d) => ({
    id: d.id,
    source: "derived",
    type: d.type,
    severity: d.severity,
    title: d.title,
    message: d.message,
    link: d.link,

    // ⭐ IMPORTANT
    // Derived notifications are no longer always unread.
    read: readDerivedIds.has(d.id),

    createdAt: d.createdAt.toISOString(),
  }));

  // ============================================================
  // PERSISTED NOTIFICATIONS
  // ============================================================

  const Notification = getCentralNotificationModel();

  const persistedFilter: Record<string, unknown> = {
    recipientRole: role,
  };

  if (role === "manager") {
    persistedFilter.branchId = {
      $in: branches.map((b) => b._id),
    };
  }

  const persisted = await Notification.find(persistedFilter)
    .sort({ createdAt: -1 })
    .limit(50);

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

  // ============================================================
  // DISMISSED
  // ============================================================

  const Dismissed = getCentralDismissedNotificationModel();

  const dismissed = await Dismissed.find({
    userId: req.user!.id,
  }).select("notificationId");

  const dismissedIds = new Set(dismissed.map((d) => d.notificationId));

  const currentDerivedIds = new Set(derivedItems.map((d) => d.id));

  const staleDismissals = dismissed.filter(
    (d) =>
      isDerivedId(d.notificationId) && !currentDerivedIds.has(d.notificationId),
  );

  if (staleDismissals.length > 0) {
    await Dismissed.deleteMany({
      userId: req.user!.id,
      notificationId: {
        $in: staleDismissals.map((d) => d.notificationId),
      },
    });

    for (const d of staleDismissals) {
      dismissedIds.delete(d.notificationId);
    }
  }

  const feed = [...derivedItems, ...persistedItems].filter(
    (item) => !dismissedIds.has(item.id),
  );

  return feed.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

// ============================================================
// GET /notifications
// ============================================================

export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const feed = await buildFeed(req);

    const unreadCount = feed.filter((item) => !item.read).length;

    return res.status(200).json({
      success: true,
      data: feed,
      unreadCount,
    });
  } catch (error: any) {
    console.error("❌ Get Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET /notifications/unread-count
// ============================================================

export const getUnreadNotificationCount = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const feed = await buildFeed(req);

    const unreadCount = feed.filter((item) => !item.read).length;

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error: any) {
    console.error("❌ Get Unread Notification Count Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// PATCH /notifications/:id/read
// ============================================================

export const markNotificationRead = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Notification id is required",
      });
    }

    // Derived notification
    if (isDerivedId(id)) {
      const ReadNotification = getCentralReadNotificationModel();

      await ReadNotification.updateOne(
        {
          userId: req.user.id,
          notificationId: id,
        },
        {
          $setOnInsert: {
            userId: req.user.id,
            notificationId: id,
            readAt: new Date(),
          },
        },
        {
          upsert: true,
        },
      );

      return res.status(200).json({
        success: true,
      });
    }

    // Persisted notification
    const Notification = getCentralNotificationModel();

    await Notification.updateOne(
      { _id: id },
      {
        $addToSet: {
          readBy: req.user.id,
        },
      },
    );

    return res.status(200).json({
      success: true,
    });
  } catch (error: any) {
    console.error("❌ Mark Notification Read Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// PATCH /notifications/read-all
// ============================================================

export const markAllNotificationsRead = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const role = req.user.role as "admin" | "manager";

    const branches = await resolveReportBranches(
      role,
      req.user.branch,
      undefined,
    );

    // ==========================================================
    // 1. Persisted notifications
    // ==========================================================

    const Notification = getCentralNotificationModel();

    const filter: Record<string, unknown> = {
      recipientRole: role,
    };

    if (role === "manager") {
      filter.branchId = {
        $in: branches.map((b) => b._id),
      };
    }

    await Notification.updateMany(filter, {
      $addToSet: {
        readBy: req.user.id,
      },
    });

    // ==========================================================
    // 2. Derived notifications
    // ==========================================================

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { sales } = await collectSalesAndReturns(branches, {
      startDate: startOfToday.toISOString(),
    });

    const derived = await getDerivedNotifications(role, branches, sales);

    if (derived.length > 0) {
      const ReadNotification = getCentralReadNotificationModel();

      await ReadNotification.bulkWrite(
        derived.map((item) => ({
          updateOne: {
            filter: {
              userId: req.user!.id,
              notificationId: item.id,
            },
            update: {
              $setOnInsert: {
                userId: req.user!.id,
                notificationId: item.id,
                readAt: new Date(),
              },
            },
            upsert: true,
          },
        })),
      );
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error: any) {
    console.error("❌ Mark All Notifications Read Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// POST /notifications/:id/dismiss
// ============================================================

export const dismissNotification = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Notification id is required",
      });
    }

    if (isDerivedId(id)) {
      const ReadNotification = getCentralReadNotificationModel();

      await ReadNotification.updateOne(
        {
          userId: req.user.id,
          notificationId: id,
        },
        {
          $setOnInsert: {
            userId: req.user.id,
            notificationId: id,
            readAt: new Date(),
          },
        },
        {
          upsert: true,
        },
      );
    } else {
      const Notification = getCentralNotificationModel();

      await Notification.updateOne(
        { _id: id },
        {
          $addToSet: {
            readBy: req.user.id,
          },
        },
      );
    }

    const Dismissed = getCentralDismissedNotificationModel();

    await Dismissed.updateOne(
      {
        userId: req.user.id,
        notificationId: id,
      },
      {
        $setOnInsert: {
          dismissedAt: new Date(),
        },
      },
      {
        upsert: true,
      },
    );

    return res.status(200).json({
      success: true,
    });
  } catch (error: any) {
    console.error("❌ Dismiss Notification Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// DELETE /notifications/:id
// ============================================================

export const deleteNotification = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Notification id is required",
      });
    }

    if (isDerivedId(id)) {
      const Dismissed = getCentralDismissedNotificationModel();

      await Dismissed.updateOne(
        {
          userId: req.user.id,
          notificationId: id,
        },
        {
          $setOnInsert: {
            dismissedAt: new Date(),
          },
        },
        {
          upsert: true,
        },
      );

      return res.status(200).json({
        success: true,
      });
    }

    const role = req.user.role as "admin" | "manager";

    const branches = await resolveReportBranches(
      role,
      req.user.branch,
      undefined,
    );

    const scopeFilter: Record<string, unknown> = {
      _id: id,
      recipientRole: role,
    };

    if (role === "manager") {
      scopeFilter.branchId = {
        $in: branches.map((b) => b._id),
      };
    }

    const Notification = getCentralNotificationModel();

    const deleted = await Notification.findOneAndDelete(scopeFilter);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Notification not found, or it's outside your scope",
      });
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error: any) {
    console.error("❌ Delete Notification Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
