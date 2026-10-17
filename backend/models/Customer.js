const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    CUSTOMER_ID: { type: String, required: true, unique: true, maxlength: 9 },
    CUSTOMER_NAME: { type: String, required: true, trim: true, maxlength: 100 },
    CUSTOMER_EMAIL: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    PASSWORD_HASH: { type: String, required: true, select: false },
  },
  { collection: "customers", versionKey: false }
);

module.exports = mongoose.model("Customer", customerSchema);