const express = require("express");
const dotenv = require("dotenv");
const colors = require("colors");
const morgan = require("morgan");
const cors = require("cors");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// MongoDB connection
connectDB()
  .then(() => console.log("MongoDB Connected Successfully".bgGreen.black))
  .catch((err) => {
    console.error("MongoDB Connection Failed:".bgRed.white, err);
    process.exit(1);
  });

// Rest object
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Routes
app.use("/api/v1/test", require("./routes/testRoutes"));
app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/inventory", require("./routes/inventoryRoutes"));
app.use("/api/v1/analytics", require("./routes/analyticsRoutes"));
app.use("/api/v1/admin", require("./routes/adminRoutes"));

// Global error-handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:".bgRed.white, err.stack);
  res
    .status(500)
    .send({
      success: false,
      message: "Something went wrong!",
      error: err.message,
    });
});

// Port
const PORT = process.env.PORT || 8080;

// Listen
app.listen(PORT, () => {
  console.log(
    `Node Server Running in ${process.env.DEV_MODE} ModeOn port ${process.env.PORT}`
      .bgBlue.white
  );
});
