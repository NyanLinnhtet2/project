import { Schema } from "mongoose";
import { centralDBConnection } from "../../db/db";

const userSchema = new Schema({
  name: String,
  email: String,
});

export const CentralUser = centralDBConnection!.model("User", userSchema);
