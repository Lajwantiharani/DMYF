const express = require("express");
const router = express.Router();
const {
  registerController,
  verifyOTPController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
} = require("../controllers/authController");

// Register Route
router.post("/register", registerController);

// Verify OTP Route
router.post("/verify-otp/:token", verifyOTPController);

// Login Route
router.post("/login", loginController);

// Forgot Password Route
router.post("/forgot-password", forgotPasswordController);

// Reset Password Route
router.post("/reset-password/:token", resetPasswordController);

module.exports = router;
