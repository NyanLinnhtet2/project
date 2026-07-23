import { Schema, Document, Model, Types } from "mongoose";
import { centralDBConnection } from "../../db/db";

export interface IDiscountEvent extends Document {
  name: string;
  scope: "all" | "branch";
  branchIds: Types.ObjectId[]; // only meaningful when scope === "branch"
  cashierCap: number; // % — replaces the static cashier cap while the event is active
  managerCap: number; // % — replaces the static manager cap while the event is active
  startDate: Date;
  endDate: Date;
  isActive: boolean; // admin can end an event early without deleting its history
  createdBy: string; // CentralDB User _id of the admin who created it
  createdAt: Date;
  updatedAt: Date;
}

const discountEventSchema = new Schema<IDiscountEvent>(
  {
    name: { type: String, required: true, trim: true },
    scope: { type: String, enum: ["all", "branch"], required: true },
    branchIds: [{ type: Schema.Types.ObjectId, ref: "Branch" }],
    cashierCap: { type: Number, required: true, min: 0, max: 100 },
    managerCap: { type: Number, required: true, min: 0, max: 100 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

// The exact query createSale runs on every checkout: "is there an event live
// right now for this branch/scope" — index it so that stays fast.
discountEventSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
discountEventSchema.index({ branchIds: 1 });

export const getCentralDiscountEventModel = (): Model<IDiscountEvent> => {
  if (!centralDBConnection) {
    throw new Error("Central DB not connected");
  }
  return (
    (centralDBConnection.models.DiscountEvent as Model<IDiscountEvent>) ||
    centralDBConnection.model<IDiscountEvent>(
      "DiscountEvent",
      discountEventSchema,
    )
  );
};