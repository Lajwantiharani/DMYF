const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const colors = require("colors");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");

const sanitizeRequest = require("./middlewares/sanitizeRequest");
const securityHeaders = require("./middlewares/securityHeaders");
const apiLogger = require("./middlewares/apiLogger");

dotenv.config();

const isVercel = Boolean(process.env.VERCEL);

const requiredEnvErrors = [];
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  requiredEnvErrors.push("JWT_SECRET is missing or too short (min 16 chars)");
}

if (!process.env.DATABASE_URL) {
  requiredEnvErrors.push("DATABASE_URL is missing");
}

// In a normal Node server, fail fast. In Vercel serverless, do not exit during
// module loading because that crashes every route, including the React app.
if (requiredEnvErrors.length > 0) {
  const message = `FATAL: ${requiredEnvErrors.join("; ")}. Set these in your environment variables.`;
  if (isVercel) {
    console.error(message);
  } else {
    console.error(message.red);
    process.exit(1);
  }
}

const app = express();

app.use(express.json({ limit: "100kb" }));
app.use(helmet());
app.use(sanitizeRequest());
app.use(securityHeaders());
app.use(apiLogger);

const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter(Boolean),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(morgan("dev"));

app.use("/api/v1/test", require("./routes/testRoutes"));
app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/inventory", require("./routes/inventoryRoutes"));
app.use("/api/v1/analytics", require("./routes/analyticsRoutes"));
app.use("/api/v1/admin", require("./routes/adminRoutes"));
app.use("/api/v1/receiver", require("./routes/receiverRoutes"));
app.use("/api/v1/inquiries", require("./routes/inquiryRoutes"));

// 404 handler for unknown API routes
app.use("/api", (req, res) => {
  return res.status(404).send({ success: false, message: "API route not found" });
});

const clientBuildPath = path.join(__dirname, "client", "build");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientBuildPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    return res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

app.use((err, req, res, next) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).send({ success: false, message: "CORS blocked" });
  }
  // Log full error server-side, but send a generic message to clients.
  if (process.env.NODE_ENV === "production") {
    console.error("[ERROR]", req.method, req.originalUrl, err.message);
  } else {
    console.error("[ERROR]", err);
  }
  return res.status(500).send({ success: false, message: "Server error" });
});

const PORT = process.env.PORT || 8080;

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(
      `Node Server Running in ${process.env.DEV_MODE || process.env.NODE_ENV || "development"} mode on port ${PORT}`
        .bgBlue.white,
    );
  });
}

module.exports = app;
