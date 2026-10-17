const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration(body) {
  const errors = [];
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 2 || name.length > 100) errors.push("Name must be 2-100 characters.");
  if (!EMAIL_RE.test(email) || email.length > 254) errors.push("Enter a valid email address.");
  if (password.length < 8 || password.length > 72) errors.push("Password must be 8-72 characters.");
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) errors.push("Password must contain a letter and a number.");

  return { errors, name, email: email.toLowerCase(), password };
}

module.exports = { validateRegistration };