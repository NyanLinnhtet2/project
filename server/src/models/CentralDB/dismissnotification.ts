import { Schema, Document, Model } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface IDismissedNotification extends Document {
  userId: string;
  notificationId: string;
  dismissedAt: Date;
}

const dismissedNotificationSchema = new Schema<IDismissedNotification>({
  userId: { type: String, required: true },
  notificationId: { type: String, required: true },
  dismissedAt: { type: Date, default: Date.now },
});

dismissedNotificationSchema.index(
  { userId: 1, notificationId: 1 },
  { unique: true },
);

export const getCentralDismissedNotificationModel =
  (): Model<IDismissedNotification> => {
    if (!centralDBConnection) throw new Error("Central DB not connected");
    return (
      centralDBConnection.models.DismissedNotification ||
      centralDBConnection.model<IDismissedNotification>(
        "DismissedNotification",
        dismissedNotificationSchema,
      )
    );
  };
