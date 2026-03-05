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

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/verify-otp", verifyOTPController);
router.post("/forgot-password/request-otp", forgotPasswordRequestOtpController);
router.post("/forgot-password/reset", resetForgotPasswordController);
router.get("/current-user", authMiddleware, currentUserController);
router.put("/update-profile", authMiddleware, updateProfileController);
router.post(
  "/request-profile-verification",
  authMiddleware,
  requestProfileVerificationController
);
module.exports = router;
