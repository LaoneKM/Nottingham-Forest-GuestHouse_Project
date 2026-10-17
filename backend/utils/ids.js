async function nextId(Model, field, prefix) {
  const last = await Model.findOne().sort({ [field]: -1 }).select(field).lean();
  const lastNumber = last ? parseInt(last[field].slice(prefix.length), 10) : 0;
  return prefix + String(lastNumber + 1).padStart(6, "0");
}

module.exports = { nextId };