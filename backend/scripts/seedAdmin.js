require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Admin = require("../models/Admin");
const { hashPassword } = require("../utils/password");
const { nextId } = require("../utils/ids");

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "";

  if (!email || password.length < 12 || password === "your_own_strong_password") {
    console.error("Set SEED_ADMIN_EMAIL and a real SEED_ADMIN_PASSWORD (12+ characters) in .env first.");
    process.exit(1);
  }

  await connectDB();

  const existing = await Admin.findOne({ ADMIN_EMAIL: email }).lean();
  if (existing) {
    console.log("Admin already exists. Nothing to do.");
    await mongoose.disconnect();
    return;
  }

  await Admin.create({
    ADMIN_ID: await nextId(Admin, "ADMIN_ID", "ADM"),
    ADMIN_NAME: "System Admin",
    ADMIN_EMAIL: email,
    PASSWORD_HASH: await hashPassword(password),
  });

  console.log("Admin created:", email);
  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});