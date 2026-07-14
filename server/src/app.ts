import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db/db";
import userRoute from "./routes/userRoute";
import branchRoute from "./routes/branchRoute";
import categoryRoute from "./routes/categoryRoute";
import brandRoute from "./routes/brandRoute";
import employeeRoute from "./routes/employeeRoute";
import cors from "cors";
import cookieParser from "cookie-parser";
import productRoute from "./routes/productRoute";

dotenv.config({
  path: "./.env",
});

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use("/api/auth", userRoute);
app.use("/api/branches", branchRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/brands", brandRoute);
app.use("/api/employees", employeeRoute);
app.use("/api/products", productRoute);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (
      err.type === "entity.too.large" ||
      err.message?.includes("request entity too large")
    ) {
      return res.status(413).json({
        success: false,
        message:
          "Image file is too large. Maximum size allowed is 5MB. Please compress your image and try again.",
      });
    }
    next(err);
  },
);

const PORT = process.env.PORT || 5000;

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
