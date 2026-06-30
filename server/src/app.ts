import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db/db";
import testRoutes from "./routes/testRoutes";

dotenv.config({
  path: "./.env",
});

const app = express();

app.use(express.json());

app.use("/api/test", testRoutes);

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
