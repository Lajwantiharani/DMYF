const express = require("express");
const {
  registerController,
  loginController,
  currentUserController,
  verifyOTPController,
  forgotPasswordRequestOtpController,
  resetForgotPasswordController,
  updateProfileController,
  requestProfileVerificationController,
  updateActivityController,
} = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const { createRateLimiter } = require("../middlewares/rateLimit");

const router = express.Router();

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => `${req.ip}:auth:${req.path}`,
  message: "Too many attempts. Please try again later.",
});

const otpLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `${req.ip}:otp:${req.path}`,
  message: "Too many OTP attempts. Please try again later.",
});

router.post("/register", authLimiter, registerController);
router.post("/login", authLimiter, loginController);
router.post("/verify-otp", otpLimiter, verifyOTPController);
router.post(
  "/forgot-password/request-otp",
  otpLimiter,
  forgotPasswordRequestOtpController,
);
router.post(
  "/forgot-password/reset",
  otpLimiter,
  resetForgotPasswordController,
);
router.get("/current-user", authMiddleware, currentUserController);
router.post("/activity", authMiddleware, updateActivityController);
router.put("/update-profile", authMiddleware, updateProfileController);
router.post(
  "/request-profile-verification",
  authMiddleware,
  requestProfileVerificationController
);
module.exports = router;
