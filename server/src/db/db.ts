import mongoose, { Connection } from "mongoose";

export interface DatabaseUrls {
  centralURL?: string;
  ygBranchURL?: string;
}

export let centralDBConnection: Connection | null;
export let ygBranchDBConnection: Connection | null;

export const connectDB = async (): Promise<void> => {
  try {
    const centralURL: DatabaseUrls["centralURL"] =
      process.env.CENTRAL_MONGO_URL;
    const ygBranchURL: DatabaseUrls["ygBranchURL"] =
      process.env.YGBRANCH_MONGO_URL;

    if (!centralURL || !ygBranchURL) {
      throw new Error("No Database URL in .env");
    }

    centralDBConnection = await mongoose
      .createConnection(centralURL)
      .asPromise();
    console.log(`CentralDB connected: ${centralDBConnection.host}`);

    ygBranchDBConnection = await mongoose
      .createConnection(ygBranchURL)
      .asPromise();
    console.log(`YGBranchDB connected: ${ygBranchDBConnection.host}`);
  } catch (err: unknown) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
};
