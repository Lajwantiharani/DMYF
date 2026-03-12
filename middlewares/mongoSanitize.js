const sanitizeValue = (value) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitizeValue);

  const sanitized = {};
  for (const [key, item] of Object.entries(value)) {
    // Prevent Mongo operator injection like {$gt: ""} or dotted keys.
    if (typeof key === "string" && (key.startsWith("$") || key.includes("."))) {
      continue;
    }
    sanitized[key] = sanitizeValue(item);
  }
  return sanitized;
};

module.exports = () => (req, _res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};

