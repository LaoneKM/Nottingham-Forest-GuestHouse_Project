require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert");

const BASE = `http://localhost:${process.env.PORT || 5000}/api/auth`;

const unique = Date.now();
const email = `autotest${unique}@example.com`;
const password = "TestPass123";

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function get(path, token) {
  const res = await fetch(BASE + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: res.status, data: await res.json() };
}

test("registers a new customer", async () => {
  const r = await post("/register", { name: "Auto Test", email, password });
  assert.strictEqual(r.status, 201);
});

test("rejects duplicate registration", async () => {
  const r = await post("/register", { name: "Auto Test", email, password });
  assert.strictEqual(r.status, 409);
});

test("rejects a weak password", async () => {
  const r = await post("/register", { name: "Weak", email: `weak${unique}@example.com`, password: "abc" });
  assert.strictEqual(r.status, 400);
});

test("ignores a role sent at registration", async () => {
  const sneaky = `sneaky${unique}@example.com`;
  await post("/register", { name: "Sneaky", email: sneaky, password, role: "admin" });
  const login = await post("/login", { email: sneaky, password });
  assert.strictEqual(login.status, 200);
  assert.strictEqual(login.data.role, "customer");
});

test("logs in with correct credentials", async () => {
  const r = await post("/login", { email, password });
  assert.strictEqual(r.status, 200);
  assert.ok(r.data.token);
  assert.strictEqual(r.data.role, "customer");
});

test("rejects unauthorized access without a token", async () => {
  const r = await get("/me");
  assert.strictEqual(r.status, 401);
});

test("rejects a customer on an admin-only route", async () => {
  const login = await post("/login", { email, password });
  const r = await get("/admin-only", login.data.token);
  assert.strictEqual(r.status, 403);
});

test("rejects a tampered token", async () => {
  const login = await post("/login", { email, password });
  const bad = login.data.token.slice(0, -3) + "abc";
  const r = await get("/me", bad);
  assert.strictEqual(r.status, 401);
});

// Keep this test LAST: it uses up the login attempts for the rate limiter.
test("rejects invalid credentials, then rate limits", async () => {
  const codes = [];
  for (let i = 0; i < 6; i++) {
    const r = await post("/login", { email, password: "WrongPass1" });
    codes.push(r.status);
  }
  assert.deepStrictEqual(codes.slice(0, 5), [401, 401, 401, 401, 401]);
  assert.strictEqual(codes[5], 429);
});