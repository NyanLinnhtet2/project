import mongoose from "mongoose";

const connections: Record<string, mongoose.Connection> = {};

// Central DB connection (optional if you need it)
export let centralDBConnection: mongoose.Connection | null = null;

/**
 * Connect Central Database
 */
export const connectDB = async (): Promise<void> => {
  try {
    const centralURL = process.env.CENTRAL_MONGO_URL;

    if (!centralURL) {
      throw new Error("No Database URL in .env");
    }

    centralDBConnection = await mongoose
      .createConnection(centralURL)
      .asPromise();

    console.log(`CentralDB connected: ${centralDBConnection.host}`);
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
};

/**
 * Get or Create Branch DB Connection
 */
export const getBranchConnection = (
  dbName: string
): mongoose.Connection => {
  if (connections[dbName]) {
    return connections[dbName];
  }

  const conn = mongoose.connection.useDb(dbName, {
    useCache: true,
  });

  connections[dbName] = conn;

  return conn;
};