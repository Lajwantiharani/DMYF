const express = require("express");
const {
  registerController,
  loginController,
  currentUserController,
  verifyOTPController,
} = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/verify-otp", verifyOTPController);
router.get("/current-user", authMiddleware, currentUserController);
module.exports = router;
