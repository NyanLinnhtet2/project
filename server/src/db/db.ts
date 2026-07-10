import mongoose from "mongoose";

const connections: Record<string, mongoose.Connection> = {};

// Central DB connection
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

    // 🌟 ဤနေရာတွင် centralDBConnection ကို ချိတ်ဆက်ထားပါသည်
    centralDBConnection = await mongoose
      .createConnection(centralURL)
      .asPromise();

    console.log(`✅ CentralDB connected: ${centralDBConnection.host}`);
  } catch (err) {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  }
};

/**
 * Get or Create Branch DB Connection
 */
export const getBranchConnection = (dbName: string): mongoose.Connection => {
  // Cache လုပ်ထားသော Connection ရှိလျှင် ယူသုံးမည်
  if (connections[dbName]) {
    return connections[dbName];
  }

  // 🌟 [အရေးကြီး] Central DB ချိတ်ဆက်မှု မရှိသေးလျှင် Error ပြမည်
  if (!centralDBConnection) {
    throw new Error("Central DB is not connected yet!");
  }

  // 🌟 [FIX] default `mongoose.connection` အစား အပေါ်တွင် ချိတ်ထားသော `centralDBConnection` ကို အသုံးပြုပါ 🌟
  const conn = centralDBConnection.useDb(dbName, {
    useCache: true,
  });

  connections[dbName] = conn;

  return conn;
};
