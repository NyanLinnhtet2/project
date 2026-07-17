import { Schema, Document, Connection, Model, Types } from "mongoose";
export interface IStock extends Document {
  productId: string | Types.ObjectId;
  quantity: number;
  lowStockThreshold: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  lastUpdated: Date;
}

const stockSchema = new Schema<IStock>(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    quantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10 }, // Default warning level
    status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock"],
      default: "Out of Stock",
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

stockSchema.pre("save", function () {
  if (this.quantity === 0) {
    this.status = "Out of Stock";
  } else if (this.quantity <= this.lowStockThreshold) {
    this.status = "Low Stock";
  } else {
    this.status = "In Stock";
  }
});

export const getBranchStockModel = (branchDb: Connection): Model<IStock> => {
  return (
    (branchDb.models.Stock as Model<IStock>) ||
    branchDb.model<IStock>("Stock", stockSchema)
  );
};
