import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Bell } from "lucide-react";

import { NotificationContext } from "./NotificationContext";

import {
  getNotificationsApi,
  markAllNotificationsReadApi,
  dismissNotificationApi,
  deleteNotificationApi,
} from "../services/notificationService";

import type { NotificationItem } from "../types/notification";

const POLL_INTERVAL_MS = 15000;

export const NotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // First load မှာ notification အဟောင်းတွေကို toast မပြချင်လို့
  const knownIdsRef = useRef<Set<string> | null>(null);

  const refresh = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setLoading(true);
    }

    try {
      const res = await getNotificationsApi();

      if (!res.success) return;

      const fresh: NotificationItem[] = res.data;

      // New notification ရှိမရှိ စစ်မယ်
      if (knownIdsRef.current !== null) {
        const newOnes = fresh.filter(
          (item) => !knownIdsRef.current!.has(item.id),
        );

        if (newOnes.length === 1) {
          toast(newOnes[0].title, {
            icon: <Bell size={16} className="text-blue-500" />,
          });
        } else if (newOnes.length > 1) {
          toast(`${newOnes.length} new notifications`, {
            icon: <Bell size={16} className="text-blue-500" />,
          });
        }
      }

      knownIdsRef.current = new Set(fresh.map((item) => item.id));

      // ဒီ state update ဖြစ်တာနဲ့
      // Sidebar ထဲက unreadCount လည်း update ဖြစ်မယ်
      setItems(fresh);
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Initial load
    const t = setTimeout(() => {
      refresh(true);
    }, 0);

    // Every 15 seconds
    pollRef.current = setInterval(() => {
      refresh(false);
    }, POLL_INTERVAL_MS);

    // Browser focus
    const handleFocus = () => {
      refresh(false);
    };

    // Tab visibility
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh(false);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }

      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);

      clearTimeout(t);
    };
  }, [refresh]);

  const dismiss = useCallback((id: string) => {
    // Optimistic update
    setItems((prev) => prev.filter((item) => item.id !== id));

    dismissNotificationApi(id).catch(() => {
      // Next refresh မှာ ပြန် sync ဖြစ်မယ်
    });
  }, []);

  const remove = useCallback((id: string) => {
    // Optimistic update
    setItems((prev) => prev.filter((item) => item.id !== id));

    deleteNotificationApi(id).catch(() => {
      // Next refresh မှာ ပြန် sync ဖြစ်မယ်
    });
  }, []);

  const markAllRead = useCallback(async () => {
    const res = await markAllNotificationsReadApi();

    if (!res.success) {
      throw new Error("Failed to mark all notifications as read");
    }

    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        read: true,
      })),
    );
  }, []);

  // ⭐ ဒီ count ကို Sidebar / Notification Page နှစ်နေရာလုံးမှာသုံးနိုင်တယ်
  const unreadCount = items.filter((item) => !item.read).length;

  return (
    <NotificationContext.Provider
      value={{
        items,
        unreadCount,
        loading,
        refresh,
        dismiss,
        remove,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
