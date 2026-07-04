import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db/db";
import userRoute from "./routes/userRoute";
import branchRoute from "./routes/branchRoute";
import categoryRoute from "./routes/categoryRoute";

dotenv.config({
  path: "./.env",
});

const app = express();

app.use(express.json());

app.use("/api/auth", userRoute);
app.use("/api/branches", branchRoute);
app.use("/api/category", categoryRoute);

const PORT = process.env.PORT || 50;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}...`);
    });
  } catch (error) {
    console.error("❌ Server not running -", error);
    process.exit(1);
  }
};

startServer();
