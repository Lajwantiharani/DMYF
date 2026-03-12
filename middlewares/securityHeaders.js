module.exports = () => (req, res, next) => {
  // Keep dev DX intact. Apply stricter headers only in production.
  const isProd = process.env.NODE_ENV === "production";

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  if (isProd) {
    // Basic CSP for a CRA build served elsewhere. Avoid breaking dev (eval).
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self';",
    );
  }

  next();
};

