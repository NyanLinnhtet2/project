import { Schema, Document, Model, Types } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface INotification extends Document {
  recipientRole: "admin" | "manager";
  branchId?: Types.ObjectId; // required when recipientRole is "manager" — which branch's manager(s) see it
  type: string; // e.g. "stock_transfer_out"
  title: string;
  message: string;
  link?: string;
  readBy: string[]; // user ids who've marked this read
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientRole: { type: String, enum: ["admin", "manager"], required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    readBy: { type: [String], default: [] },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientRole: 1, branchId: 1, createdAt: -1 });

export const getCentralNotificationModel = (): Model<INotification> => {
  if (!centralDBConnection) throw new Error("Central DB not connected");
  return (
    centralDBConnection.models.Notification ||
    centralDBConnection.model<INotification>("Notification", notificationSchema)
  );
};