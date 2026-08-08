import { Schema, Document, Model } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface IReadNotification extends Document {
  userId: string;
  notificationId: string;
  readAt: Date;
}

const readNotificationSchema = new Schema<IReadNotification>(
  {
    userId: {
      type: String,
      required: true,
    },
    notificationId: {
      type: String,
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

readNotificationSchema.index(
  { userId: 1, notificationId: 1 },
  { unique: true },
);

export const getCentralReadNotificationModel = (): Model<IReadNotification> => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }

  return (
    centralDBConnection.models.ReadNotification ||
    centralDBConnection.model<IReadNotification>(
      "ReadNotification",
      readNotificationSchema,
    )
  );
};
