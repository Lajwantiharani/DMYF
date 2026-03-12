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
} = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const { createRateLimiter } = require("../middlewares/rateLimit");

const router = express.Router();

const keyByIpAndEmail = (req) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  return `${req.ip}:${req.originalUrl}:${email}`;
};

router.post(
  "/register",
  createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => `${req.ip}:/register`,
    message: "Too many registrations from this IP. Please try again later.",
  }),
  registerController,
);
router.post(
  "/login",
  createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 15,
    keyGenerator: keyByIpAndEmail,
    message: "Too many login attempts. Please try again later.",
  }),
  loginController,
);
router.post(
  "/verify-otp",
  createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyGenerator: keyByIpAndEmail,
    message: "Too many OTP attempts. Please try again later.",
  }),
  verifyOTPController,
);
router.post(
  "/forgot-password/request-otp",
  createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
    keyGenerator: keyByIpAndEmail,
    message: "Too many OTP requests. Please try again later.",
  }),
  forgotPasswordRequestOtpController,
);
router.post(
  "/forgot-password/reset",
  createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 20,
    keyGenerator: keyByIpAndEmail,
    message: "Too many reset attempts. Please try again later.",
  }),
  resetForgotPasswordController,
);
router.get("/current-user", authMiddleware, currentUserController);
router.put("/update-profile", authMiddleware, updateProfileController);
router.post(
  "/request-profile-verification",
  authMiddleware,
  requestProfileVerificationController
);
module.exports = router;
