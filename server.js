const express = require("express");
const dotenv = require("dotenv");
const colors = require("colors");
const morgan = require("morgan");
const cors = require("cors");
const connectDB = require("./config/db");

const mongoSanitize = require("./middlewares/mongoSanitize");
const securityHeaders = require("./middlewares/securityHeaders");

//dot config
dotenv.config();

//
//mongodb connection
connectDB();
//rest object

const app = express();

//middlewares
app.use(express.json());


app.use(mongoSanitize());
app.use(securityHeaders());

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

// Basic error handler (e.g., CORS rejections)
app.use((err, req, res, next) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).send({ success: false, message: "CORS blocked" });
  }
  console.log(err);
  return res
    .status(500)
    .send({ success: false, message: "Server error", error: err?.message });
});
//const
const PORT = process.env.PORT || 8080;

//listen
app.listen(PORT, () => {
  console.log(
    `Node Server Running in ${process.env.DEV_MODE} ModeOn port ${process.env.PORT}`
      .bgBlue.white
  );
});
