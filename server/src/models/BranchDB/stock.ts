import { Schema, Types } from "mongoose";
// import { ygBranchDBConnection } from "../../db/db";

interface IStock {
  product: Types.ObjectId;
  quantity: number;
}

const stockSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true },
);

// export const getYGNBranchStockModel = () => {
//   if (!ygBranchDBConnection) {
//     throw new Error("YGN Branch DB connection not found");
//   }
//   return ygBranchDBConnection.model("Stock", stockSchema);
// };
