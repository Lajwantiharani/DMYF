const buckets = new Map();

const nowMs = () => Date.now();

const getBucket = (key, windowMs) => {
  const current = buckets.get(key);
  const now = nowMs();

  if (!current || current.resetAt <= now) {
    const next = { count: 0, resetAt: now + windowMs };
    buckets.set(key, next);
    return next;
  }

  return current;
};

const cleanupOccasionally = () => {
  // Lightweight cleanup to prevent unbounded growth.
  if (buckets.size < 2000) return;
  const now = nowMs();
  for (const [key, bucket] of buckets.entries()) {
    if (!bucket || bucket.resetAt <= now) buckets.delete(key);
  }
};

const createRateLimiter = ({ windowMs, max, keyGenerator, message }) => {
  const safeWindowMs = Number(windowMs) > 0 ? Number(windowMs) : 60 * 1000;
  const safeMax = Number(max) > 0 ? Number(max) : 60;
  const msg = message || "Too many requests, please try again later.";

  return (req, res, next) => {
    cleanupOccasionally();

    const keyBase =
      typeof keyGenerator === "function"
        ? keyGenerator(req)
        : `${req.ip}:${req.originalUrl}`;

    const key = String(keyBase || `${req.ip}:${req.originalUrl}`);
    const bucket = getBucket(key, safeWindowMs);
    bucket.count += 1;

    res.setHeader("X-RateLimit-Limit", safeMax);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, safeMax - bucket.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > safeMax) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - nowMs()) / 1000));
      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).send({ success: false, message: msg });
    }

    next();
  };
};

module.exports = { createRateLimiter };

