const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const colors = require("colors");
const morgan = require("morgan");
const cors = require("cors");
const connectDB = require("./config/db");

const mongoSanitize = require("./middlewares/mongoSanitize");
const securityHeaders = require("./middlewares/securityHeaders");
const apiLogger = require("./middlewares/apiLogger");

//dot config
dotenv.config();

//
//mongodb connection
connectDB();
//rest object

const app = express();

//middlewares
app.use(express.json({ limit: "100kb" }));


app.use(mongoSanitize());
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
      // allow non-browser requests (no Origin) and allowlisted origins
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(morgan("dev"));
//routes
app.use("/api/v1/test", require("./routes/testRoutes"));
app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use ("/api/v1/inventory",require("./routes/inventoryRoutes"));
app.use("/api/v1/analytics", require("./routes/analyticsRoutes"));
app.use("/api/v1/admin", require("./routes/adminRoutes"));
app.use("/api/v1/receiver", require("./routes/receiverRoutes"));

app.use("/api/v1/inquiries", require("./routes/inquiryRoutes"));

// Serve React build in production (single-service deploy)
const clientBuildPath = path.join(__dirname, "client", "build");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientBuildPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    return res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

// Basic error handler (e.g., CORS rejections)
app.use((err, req, res, next) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).send({ success: false, message: "CORS blocked" });
  }
  console.log(err);
  return res
    .status(500)
    .send({ success: false, message: "Server error" });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(
    `Node Server Running in ${process.env.DEV_MODE || process.env.NODE_ENV || "development"} mode on port ${PORT}`
      .bgBlue.white
  );
});
