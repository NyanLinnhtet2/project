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
      email: "admin@clothhub.com",
    });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists.");
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.name}`);
      console.log(`🔑 Role: ${existingAdmin.role}`);
      process.exit(0);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("admin123", saltRounds);

    // Create admin with full User interface fields
    const admin = await User.create({
      name: "System Admin",
      email: "admin@clothhub.com",
      password: hashedPassword,
      phone: "09-123456789",
      position: "System Administrator",
      role: "admin",
      branch: "System",
      joinDate: new Date(),
      status: "active",
      image: {
        url: "https://ui-avatars.com/api/?name=System+Admin&background=6366f1&color=fff&size=128",
        public_id: "default_admin",
      },
    });

    console.log("✅ Admin created successfully.");
    console.log("📋 Admin Details:");
    console.log(`   👤 Name: ${admin.name}`);
    console.log(`   📧 Email: ${admin.email}`);
    console.log(`   🔑 Password: admin123`);
    console.log(`   🏢 Branch: ${admin.branch}`);
    console.log(`   👔 Role: ${admin.role}`);
    console.log(`   📅 Join Date: ${admin.joinDate}`);
    console.log("⚠️ Please change the default password after first login!");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Seed Error:", error.message);
    if (error.code === 11000) {
      console.error(
        "⚠️ Duplicate key error - Admin may already exist with this email.",
      );
    }
    process.exit(1);
  }
};

seedAdmin();
