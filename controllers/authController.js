const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { sendResetEmail } = require("../utils/email");

// Register Controller (Enhanced with OTP and Token Return)
const registerController = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      organizationName,
      hospitalName,
      website,
      address,
      phone,
    } = req.body;
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .send({ success: false, message: "Please Fill All Required Fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .send({ success: false, message: "User Already Exists" });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    const user = await User.create({
      name,
      email,
      password,
      role,
      organizationName,
      hospitalName,
      website,
      address,
      phone,
      otp,
      otpExpiry,
      isVerified: false,
    });

    // Generate JWT token for OTP verification
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "USER@123",
      { expiresIn: "10m" }
    );

    const message = `Your OTP for email verification is: ${otp}. It is valid for 10 minutes.`;
    try {
      await sendResetEmail(email, message);
      res.status(201).send({
        success: true,
        message: "User Registered Successfully. OTP sent to your email.",
        user: { email: user.email },
        token, // Return token for frontend to redirect to /verify-otp/:token
      });
    } catch (error) {
      console.error("Error sending OTP email:", error);
      res.status(201).send({
        success: true,
        message:
          "User Registered Successfully, but failed to send OTP email. Please try verifying later.",
        user: { email: user.email },
        token,
      });
    }
  } catch (error) {
    console.log("Error in Register Controller:", error);
    res
      .status(500)
      .send({ success: false, message: "Error in Register API", error });
  }
};

// Verify OTP Controller
const verifyOTPController = async (req, res) => {
  try {
    const { token } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res
        .status(400)
        .send({ success: false, message: "OTP is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "USER@123");
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid Token or User Not Found" });
    }

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res
      .status(200)
      .send({ success: true, message: "Email Verified Successfully" });
  } catch (error) {
    console.log("Error in Verify OTP Controller:", error);
    res
      .status(500)
      .send({ success: false, message: "Error in Verify OTP API", error });
  }
};

// Login Controller
const loginController = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res
        .status(400)
        .send({ success: false, message: "Please Fill All Fields" });
    }

    const user = await User.findOne({ email, role });
    if (!user) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid Email or Role" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid Password" });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .send({
          success: false,
          message: "Please Verify Your Email with OTP First",
        });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "USER@123",
      { expiresIn: "7d" }
    );
    res.status(200).send({
      success: true,
      message: "Login Successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("Error in Login Controller:", error);
    res
      .status(500)
      .send({ success: false, message: "Error in Login API", error });
  }
};

// Forgot Password Controller
const forgotPasswordController = async (req, res) => {
  try {
    console.log("Received request for /forgot-password with body:", req.body);
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .send({ success: false, message: "Email is required" });
    }

    console.log("Searching for user with email:", email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found with email:", email);
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    console.log("Found user:", user);
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "USER@123",
      { expiresIn: "5m" }
    );
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    const baseUrl = process.env.APP_URL_BASE || "http://localhost:3000";
    console.log("Using base URL:", baseUrl);
    const resetUrl = `${baseUrl}/reset-password/${token}`;
    console.log("Generated reset URL:", resetUrl);

    const message = `You requested a password reset. Please click this link to reset your password: ${resetUrl}`;

    try {
      await sendResetEmail(email, message);
      res
        .status(200)
        .send({ success: true, message: "Reset password email sent" });
    } catch (error) {
      console.error("Error in forgotPasswordController:", error);
      res.status(200).send({
        success: true,
        message:
          "Reset token generated, but failed to send email. Please try again later or contact support.",
        resetUrl,
      });
    }
  } catch (error) {
    console.error("Error in forgotPasswordController:", error);
    res
      .status(500)
      .send({
        success: false,
        message: "Error in Forgot Password API",
        error: error.message,
      });
  }
};

// Reset Password Controller
const resetPasswordController = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .send({ success: false, message: "Password is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "USER@123");
    const user = await User.findOne({
      _id: decoded.userId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid or expired token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res
      .status(200)
      .send({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.log("Error in Reset Password Controller:", error);
    res
      .status(500)
      .send({ success: false, message: "Error in Reset Password API", error });
  }
};

module.exports = {
  registerController,
  verifyOTPController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
};
