export type NotificationSeverity = "info" | "warning" | "urgent";
export type NotificationSource = "persisted" | "derived";

export interface NotificationItem {
  id: string;
  source: NotificationSource;
  type: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}