const express = require("express");
const Customer = require("../models/Customer");
const Admin = require("../models/Admin");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signToken } = require("../utils/token");
const { nextId } = require("../utils/ids");
const { validateRegistration } = require("../utils/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimit");

const router = express.Router();

// ---------- REGISTER ----------
router.post("/register", registerLimiter, async (req, res) => {
  const { errors, name, email, password } = validateRegistration(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const existing = await Customer.findOne({ CUSTOMER_EMAIL: email }).lean();
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await hashPassword(password);

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await Customer.create({
          CUSTOMER_ID: await nextId(Customer, "CUSTOMER_ID", "CUS"),
          CUSTOMER_NAME: name,
          CUSTOMER_EMAIL: email,
          PASSWORD_HASH: passwordHash,
        });
        return res.status(201).json({ message: "Registration successful." });
      } catch (err) {
        const isDuplicate = err.code === 11000;
        if (isDuplicate && err.keyPattern && err.keyPattern.CUSTOMER_EMAIL) {
          return res.status(409).json({ error: "An account with this email already exists." });
        }
        if (!isDuplicate || attempt === 2) throw err;
      }
    }
  } catch (err) {
    console.error("Registration error:", err.message);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ---------- LOGIN ----------
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5QWqk3RZ1xXKQz6mZ3X0W9bXx4yq8cK";

router.post("/login", loginLimiter, async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!email || !password || password.length > 72) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    let account = null;
    let role = null;

    const customer = await Customer.findOne({ CUSTOMER_EMAIL: email }).select("+PASSWORD_HASH");
    if (customer) {
      account = { id: customer.CUSTOMER_ID, hash: customer.PASSWORD_HASH };
      role = "customer";
    } else {
      const admin = await Admin.findOne({ ADMIN_EMAIL: email }).select("+PASSWORD_HASH");
      if (admin) {
        account = { id: admin.ADMIN_ID, hash: admin.PASSWORD_HASH };
        role = "admin";
      }
    }

    const passwordOk = await verifyPassword(password, account ? account.hash : DUMMY_HASH);

    if (!account || !passwordOk) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(account.id, role);
    return res.json({ token, role });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ---------- PROTECTED TEST ROUTES ----------
router.get("/me", requireAuth, (req, res) => {
  res.json({ id: req.user.id, role: req.user.role });
});

router.get("/admin-only", requireAuth, requireRole("admin"), (req, res) => {
  res.json({ message: "Welcome, admin." });
});

module.exports = router;