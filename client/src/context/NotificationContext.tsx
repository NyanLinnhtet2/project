import { createContext } from "react";
import type { NotificationItem } from "../types/notification";

export interface NotificationContextType {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refresh: (showSpinner?: boolean) => Promise<void>;
  dismiss: (id: string) => void;
  remove: (id: string) => void;
  markAllRead: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);