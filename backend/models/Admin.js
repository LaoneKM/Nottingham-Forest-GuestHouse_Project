const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    ADMIN_ID: { type: String, required: true, unique: true, maxlength: 9 },
    ADMIN_NAME: { type: String, required: true, trim: true, maxlength: 100 },
    ADMIN_EMAIL: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    PASSWORD_HASH: { type: String, required: true, select: false },
  },
  { collection: "admins", versionKey: false }
);

module.exports = mongoose.model("Admin", adminSchema);