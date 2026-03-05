const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../client/src/utils/sendEmail");
const generateOTP = require("../client/src/utils/generateOTP");

const hasValue = (value) => typeof value === "string" && value.trim().length > 0;

const getDisplayNameForRole = (user) => {
  if (!user) return "";
  if (user.role === "organization") return user.organizationName || "";
  if (user.role === "hospital") return user.hospitalName || "";
  return user.name || "";
};

const isProfileComplete = (user) => {
  if (!user) return false;

  const requiredFields = [
    getDisplayNameForRole(user),
    user.email,
    user.phone,
    user.city,
    user.address,
    user.bloodGroup,
    user.nukh,
    user.akaah,
  ];

  return requiredFields.every(hasValue);
};

const notifyAdminsForVerificationRequest = async (requestUser) => {
  try {
    const admins = await userModel.find({ role: "admin" }).select("email");
    const adminEmails = admins
      .map((admin) => admin?.email)
      .filter((email) => hasValue(email));

    if (!adminEmails.length) {
      console.log("No admin email found for verification request notification");
      return false;
    }

    const displayName = getDisplayNameForRole(requestUser) || "Unknown User";
    const requestedAt = requestUser?.profileVerificationRequestedAt
      ? new Date(requestUser.profileVerificationRequestedAt).toLocaleString()
      : new Date().toLocaleString();

    return await sendEmail({
      to: adminEmails.join(","),
      subject: "New Profile Verification Request - DMYVF",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2c3e50;">New Verification Request Received</h2>
          <p>A user has requested profile verification.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Name</strong></td><td style="padding: 8px; border: 1px solid #eee;">${displayName}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #eee;">${requestUser?.email || ""}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Role</strong></td><td style="padding: 8px; border: 1px solid #eee;">${requestUser?.role || ""}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>User ID</strong></td><td style="padding: 8px; border: 1px solid #eee;">${requestUser?._id?.toString() || ""}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Requested At</strong></td><td style="padding: 8px; border: 1px solid #eee;">${requestedAt}</td></tr>
          </table>
          <p style="margin-top: 16px;">Please review this request in the admin panel.</p>
        </div>
      `,
    });
  } catch (error) {
    console.log("Admin verification request notification failed:", error.message);
    return false;
  }
};

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
      bloodGroup,
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
      bloodGroup,
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
    if (error?.name === "ValidationError") {
      const firstErrorMessage =
        Object.values(error.errors || {})[0]?.message || "Validation error";
      return res.status(400).send({
        success: false,
        message: firstErrorMessage,
        error: error.message,
      });
    }
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

const forgotPasswordRequestOtpController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({
        success: false,
        message: "Email is required",
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(200).send({
        success: true,
        message: "If this email exists, an OTP has been sent.",
      });
    }

    const oneHourMs = 60 * 60 * 1000;
    const now = Date.now();
    const lastRequestedAt = user?.forgotPasswordRequestedAt
      ? new Date(user.forgotPasswordRequestedAt).getTime()
      : 0;

    if (lastRequestedAt && now - lastRequestedAt < oneHourMs) {
      const remainingMs = oneHourMs - (now - lastRequestedAt);
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
      return res.status(429).send({
        success: false,
        message: `You can request password reset only once per hour. Try again in ${remainingMinutes} minute(s).`,
      });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.forgotPasswordRequestedAt = new Date();
    await user.save();

    const clientBaseUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetUrl = `${clientBaseUrl}/reset-password?email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: "Password Reset OTP - DMYVF",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2c3e50;">Reset Your Password</h2>
          <p>Use the OTP below to reset your password:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 8px; text-align: center; margin: 30px 0;">
            ${otp}
          </p>
          <p>Or click this reset link:</p>
          <p><a href="${resetUrl}" target="_blank" rel="noreferrer">${resetUrl}</a></p>
          <p>This OTP expires in <strong>10 minutes</strong>.</p>
          <p>For security, password reset can be requested only once per hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    return res.status(200).send({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error sending password reset OTP",
      error: error.message,
    });
  }
};

const resetForgotPasswordController = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).send({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).send({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).send({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    if (!user.otp || String(user.otp).trim() !== String(otp).trim()) {
      return res.status(400).send({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).send({
        success: false,
        message: "OTP has expired",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return res.status(200).send({
      success: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error resetting password",
      error: error.message,
    });
  }
};

const updateProfileController = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      city,
      address,
      bloodGroup,
      nukh,
      akaah,
      newPassword,
      confirmPassword,
    } = req.body;
    let isPasswordUpdated = false;

    const user = await userModel.findById(req.body.userId);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    if (email && email !== user.email) {
      const existingUser = await userModel.findOne({
        email,
        _id: { $ne: user._id },
      });
      if (existingUser) {
        return res.status(400).send({
          success: false,
          message: "Email already in use",
        });
      }
      user.email = email;
    }

    if (typeof name === "string") {
      if (user.role === "organization") {
        user.organizationName = name;
      } else if (user.role === "hospital") {
        user.hospitalName = name;
      } else {
        user.name = name;
      }
    }

    if (typeof phone === "string") {
      user.phone = phone;
    }

    if (typeof city === "string") {
      user.city = city;
    }

    if (typeof address === "string") {
      user.address = address;
    }

    if (typeof bloodGroup === "string") {
      user.bloodGroup = bloodGroup;
    }

    if (typeof nukh === "string") {
      user.nukh = nukh;
    }

    if (typeof akaah === "string") {
      user.akaah = akaah;
    }

    if (newPassword || confirmPassword) {
      if (!newPassword || !confirmPassword) {
        return res.status(400).send({
          success: false,
          message: "Please enter both new password and confirm password",
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).send({
          success: false,
          message: "New password and confirm password do not match",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).send({
          success: false,
          message: "New password must be at least 6 characters",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      isPasswordUpdated = true;
    }

    await user.save();

    if (isPasswordUpdated) {
      const displayName =
        user.name || user.organizationName || user.hospitalName || "User";

      try {
        await sendEmail({
          to: user.email,
          subject: "Password Reset Successful - DMYVF",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #2c3e50;">Password Updated Successfully</h2>
              <p>Hello ${displayName},</p>
              <p>Your account password was changed successfully.</p>
              <p>If you did not perform this action, please reset your password immediately and contact support.</p>
              <hr style="border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #777;">
                &copy; ${new Date().getFullYear()} ${process.env.APP_NAME || "DMYVF"}.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.log("Password reset email failed:", emailError.message);
      }
    }

    return res.status(200).send({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in profile update API",
      error: error.message,
    });
  }
};

const requestProfileVerificationController = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(400).send({
        success: false,
        message: "Admin does not require profile verification",
      });
    }

    if (!isProfileComplete(user)) {
      return res.status(400).send({
        success: false,
        message: "Please complete all profile fields before requesting verification",
      });
    }

    if (user.profileVerificationStatus === "approved") {
      return res.status(200).send({
        success: true,
        message: "Your profile is already verified",
        user,
      });
    }

    user.profileVerificationStatus = "pending";
    user.profileVerificationRequestedAt = new Date();
    await user.save();

    await notifyAdminsForVerificationRequest(user);

    return res.status(200).send({
      success: true,
      message: "Verification request submitted successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error requesting profile verification",
      error: error.message,
    });
  }
};
module.exports = {
  registerController,
  loginController,
  currentUserController,
  verifyOTPController,
  forgotPasswordRequestOtpController,
  resetForgotPasswordController,
  updateProfileController,
  requestProfileVerificationController,
};



