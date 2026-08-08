import { Types } from "mongoose";
import { getCentralNotificationModel } from "../models/CentralDB/notification";

interface CreateNotificationInput {
  recipientRole: "admin" | "manager";
  branchId?: Types.ObjectId | string; // required for recipientRole "manager"
  type: string;
  title: string;
  message: string;
  link?: string;
}

// Fire-and-forget by design at call sites — a notification failing to write
// should never fail the action that triggered it (e.g. an approved
// transfer). Callers should wrap this in try/catch and just log on error,
// same pattern used for coupon redemption / customer stat updates elsewhere.
export const createNotification = async (input: CreateNotificationInput) => {
  const Notification = getCentralNotificationModel();
  return Notification.create({ ...input, readBy: [] });
};