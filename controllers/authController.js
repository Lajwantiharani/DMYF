const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../client/src/utils/sendEmail");
const generateOTP = require("../client/src/utils/generateOTP");

const registerController = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      name,
      organizationName,
      hospitalName,
      address,
      phone,
      website,
    } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log("🔐 OTP Generated:", otp, "Type:", typeof otp);

    // Create user (not verified yet)
    const user = new userModel({
      email,
      password: hashedPassword,
      role,
      name,
      organizationName,
      hospitalName,
      address,
      phone,
      website,
      isVerified: false,
      otp,
      otpExpires,
    });

    await user.save();

    // Send OTP email
    const emailSent = await sendEmail({
      to: email,
      subject: "Verify Your Email - DMYVF",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2c3e50;">Welcome to ${process.env.APP_NAME || "DMYVF"}!</h2>
          <p>Thank you for registering.</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 8px; text-align: center; margin: 30px 0;">
            ${otp}
          </p>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #777;">
            © ${new Date().getFullYear()} ${process.env.APP_NAME || "DMYVF"}. All rights reserved.
          </p>
        </div>
      `,
    });

    if (!emailSent) {
      console.log("❌ Email sending failed for:", email);
      // Optional: delete user if email fails (depends on your policy)
      await userModel.findByIdAndDelete(user._id);
      return res.status(500).send({
        success: false,
        message:
          "Failed to send verification email. Please check your email configuration.",
      });
    }

    console.log("✅ User registered successfully. OTP sent to:", email);
    return res.status(201).send({
      success: true,
      message:
        "Registration successful! Please check your email to verify your account.",
      userId: user._id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Register API",
      error: error.message,
    });
  }
};

//login call back
const loginController = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not Registered!",
      });
    }
    //check role
    if (user.role !== req.body.role) {
      return res.status(500).send({
        success: false,
        message: "role dosent match",
      });
    }
    //compare password
    const comparePassword = await bcrypt.compare(
      req.body.password,
      user.password,
    );
    if (!comparePassword) {
      return res.status(500).send({
        success: false,
        message: "Invalid Credentials",
      });
    }
    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).send({
        success: false,
        message: "Please verify your email first.",
      });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return res.status(200).send({
      success: true,
      message: "Login Successfully",
      token,
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In Login API",
      error,
    });
  }
};

//GET CURRENT USER
const currentUserController = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.body.userId });
    return res.status(200).send({
      success: true,
      message: "User Fetched Successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "unable to get current user",
      error,
    });
  }
};
const verifyOTPController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).send({
        success: false,
        message: "Account already verified",
      });
    }

    // Debug logs
    console.log("📝 OTP Verification Debug:");
    console.log("   Email:", email);
    console.log("   OTP from request:", otp, "Type:", typeof otp);
    console.log("   OTP from DB:", user.otp, "Type:", typeof user.otp);
    console.log("   OTP Expires:", user.otpExpires);
    console.log("   Current Time:", new Date());

    // Convert both to string for comparison (handle number/string mismatch)
    const otpFromReq = String(otp).trim();
    const otpFromDB = String(user.otp).trim();

    if (!user.otp || otpFromReq !== otpFromDB) {
      console.log("❌ OTP Mismatch!");
      return res.status(400).send({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      console.log("❌ OTP Expired!");
      return res.status(400).send({
        success: false,
        message: "OTP has expired. Please register again.",
      });
    }

    // Success → verify user & clear OTP
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    console.log("✅ Email verified successfully for:", email);
    return res.status(200).send({
      success: true,
      message: "Email verified successfully! You can now login.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error verifying OTP",
      error: error.message,
    });
  }
};
module.exports = {
  registerController,
  loginController,
  currentUserController,
  verifyOTPController,
};
