import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import { connectDB as connectCentralDB } from "../db/db";
import { getCentralUserModel } from "../models/CentralDB/user";

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectCentralDB();

    const User = getCentralUserModel();

    const existingAdmin = await User.findOne({
      email: "admin@gmail.com",
    });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("admin@123", 10);

    await User.create({
      name: "Admin",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "admin",
      branch: "",
    });

    console.log("✅ Admin created successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed Error:", error);
    process.exit(1);
  }
};

seedAdmin();
