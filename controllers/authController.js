const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const crypto = require("crypto");
const sendEmail = require("../client/src/utils/sendEmail");
const generateOTP = require("../client/src/utils/generateOTP");

const hasValue = (value) => typeof value === "string" && value.trim().length > 0;

const isValidEmail = (email) =>
  typeof email === "string" &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = typeof user.toObject === "function" ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpires;
  delete obj.forgotPasswordRequestedAt;
  return obj;
};

const otpSecret = () =>
  process.env.OTP_SECRET || process.env.JWT_SECRET || "otp_secret";

const hashOtp = (otp) =>
  crypto
    .createHash("sha256")
    .update(`${String(otp).trim()}:${otpSecret()}`)
    .digest("hex");

const safeEqual = (a, b) => {
  try {
    const ba = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
};

const otpMatches = (storedOtp, providedOtp) => {
  if (!storedOtp || !providedOtp) return false;
  const stored = String(storedOtp).trim();
  const provided = String(providedOtp).trim();

  // Backward compatibility: accept old plaintext OTP values (typically 6 digits).
  if (/^\d{4,8}$/.test(stored)) {
    return safeEqual(stored, provided);
  }

  return safeEqual(stored, hashOtp(provided));
};

const getDisplayNameForRole = (user) => {
  if (!user) return "";
  if (user.role === "organization") return user.organizationName || "";
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

  ];

  if (user.role !== "organization") {
    requiredFields.push(user.bloodGroup);
    requiredFields.push(user.nukh, user.akaah);
  }

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

    process.nextTick(() => {
      sendEmail({
        to: adminEmails.join(","),
        subject: "New Profile Verification Request - DMYF",
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
      }).catch((err) => {
        console.log("Admin verification request notification failed:", err?.message);
      });
    });
    return true;
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
      phone,
      bloodGroup,
    } = req.body;


    if (!isValidEmail(email)) {
      return res.status(400).send({ success: false, message: "Invalid email" });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).send({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const allowedRoles = new Set(["organization", "donor", "receiver"]);
    if (!allowedRoles.has(role)) {
      return res.status(400).send({ success: false, message: "Invalid role" });
    }

    if (role === "organization" && !hasValue(organizationName)) {
      return res.status(400).send({ success: false, message: "Organization name is required" });
    }

    if (role !== "organization" && !hasValue(name)) {
      return res.status(400).send({ success: false, message: "Name is required" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = new userModel({
      email,
      password: hashedPassword,
      role,
      name,
      organizationName,
      phone,
      bloodGroup,
      isVerified: false,
      otp: hashOtp(otp),
      otpExpires,
    });

    await user.save();

    const emailSent = await sendEmail({
      to: email,
      subject: "Verify Your Email - DMYF",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #b4232b; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">DMYF Blood Bank</h1>
          </div>
          <div style="padding: 30px; color: #333; line-height: 1.6;">
            <h2 style="color: #2c3e50; margin-top: 0;">Welcome to DMYF Blood Bank!</h2>
            <p>Thank you for registering with us. To complete your registration, please use the following verification code:</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 8px; text-align: center; margin: 30px 0; color: #b4232b; background: #fff5f5; padding: 10px; border-radius: 4px;">
              ${otp}
            </p>
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
            <p style="font-size: 12px; color: #777; margin-bottom: 0;">
              &copy; ${new Date().getFullYear()} DMYF Blood Bank. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    if (!emailSent) {
      console.log("Email sending failed for:", email);
      await userModel.findByIdAndDelete(user._id);
      return res.status(500).send({
        success: false,
        message:
          "Failed to send verification email. Please check your email configuration.",
      });
    }

    console.log("User registered successfully. OTP sent to:", email);
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
      });
    }
    res.status(500).send({
      success: false,
      message: "Error in Register API",
    });
  }
};

//login call back
const loginController = async (req, res) => {
  try {

    const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).send({
        success: false,
        message: "Invalid Credentials",
      });
    }
    //compare password
    const comparePassword = await bcrypt.compare(

      password,
      user.password,
    );
    if (!comparePassword) {
      return res.status(401).send({
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

    user.lastActiveAt = new Date();
    await user.save();

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.status(200).send({
      success: true,
      message: "Login Successfully",
      token,

      user: sanitizeUser(user),
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In Login API",
    });
  }
};

//GET CURRENT USER
const currentUserController = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.body.userId });
    if (user) {
      user.lastActiveAt = new Date();
      await user.save();
    }
    return res.status(200).send({
      success: true,
      message: "User Fetched Successfully",

      user: sanitizeUser(user),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "unable to get current user",
    });
  }
};

const updateActivityController = async (req, res) => {
  try {
    await userModel.findByIdAndUpdate(req.body.userId, {
      $set: { lastActiveAt: new Date() },
    });

    return res.status(200).send({
      success: true,
      message: "Activity updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error updating activity",
    });
  }
};
const verifyOTPController = async (req, res) => {
  try {
    const { email, otp } = req.body;


    if (!isValidEmail(email)) {
      return res.status(400).send({ success: false, message: "Invalid email" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "Invalid OTP",
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

    // Avoid logging OTP values.
    console.log("   Current Time:", new Date());

    // Convert both to string for comparison (handle number/string mismatch)
    const otpFromReq = String(otp).trim();
    const otpFromDB = String(user.otp).trim();


    if (!user.otp || !otpMatches(user.otp, otpFromReq)) {
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


    if (!isValidEmail(email)) {
      return res.status(200).send({
        success: true,
        message: "If this email exists, an OTP has been sent.",
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

    user.otp = hashOtp(otp);
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.forgotPasswordRequestedAt = new Date();
    await user.save();

    const clientBaseUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetUrl = `${clientBaseUrl}/reset-password?email=${encodeURIComponent(email)}`;

    const displayName = getDisplayNameForRole(user) || "User";
    process.nextTick(() => {
      sendEmail({
        to: email,
        subject: "Password Reset Request - DMYF",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #b4232b; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">DMYF</h1>
          </div>
          <div style="padding: 30px; color: #333; line-height: 1.6;">
            <p style="font-size: 18px; margin-top: 0;">Hello <strong>${displayName}</strong>,</p>
            <p>We received a request to reset your password. Click the button below to set a new password for your account.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #b4232b; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p>If you prefer using an OTP, your code is:</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 20px 0; color: #b4232b; background: #fff5f5; padding: 10px; border-radius: 4px;">
              ${otp}
            </p>
            <p style="font-style: italic; color: #666;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
            <p style="font-size: 13px; color: #999; margin-bottom: 0;">
              For security reasons, this link and OTP will expire in <strong>10 mins</strong>.<br>
              © ${new Date().getFullYear()} DMYF Blood Bank.
            </p>
          </div>
        </div>
      `,
      }).catch((err) => {
        console.log("Password reset email failed:", err?.message);
      });
    });

    return res.status(200).send({
      success: true,
      message: "If this email exists, an OTP has been sent.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error sending password reset OTP",
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


    if (!isValidEmail(email)) {
      return res.status(400).send({ success: false, message: "Invalid email" });
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

      return res.status(400).send({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (!user.otp || !otpMatches(user.otp, otp)) {
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
      dob,
      website,
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

    // Handle date of birth - store as user entered format (DD/MM/YYYY)
    // If it's an ISO string (from date picker), convert to DD/MM/YYYY format
    if (typeof dob === "string") {
      if (dob.includes("T") && dob.includes("Z")) {
        // It's an ISO string from date picker - convert to DD/MM/YYYY
        const dateObj = new Date(dob);
        if (!isNaN(dateObj.getTime())) {
          const day = String(dateObj.getDate()).padStart(2, "0");
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const year = dateObj.getFullYear();
          user.dob = `${day}/${month}/${year}`;
        }
      } else {
        // It's already in user-entered format
        user.dob = dob;
      }
    }


    if (typeof website === "string") {
      user.website = website;
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
        user.name || user.organizationName || "User";

      process.nextTick(() => {
        sendEmail({
          to: user.email,
          subject: "Password Reset Successful - DMYF",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #b4232b; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">DMYF</h1>
              </div>
              <div style="padding: 30px; color: #333; line-height: 1.6;">
                <h2 style="color: #2c3e50; margin-top: 0;">Password Updated Successfully</h2>
                <p>Hello <strong>${displayName}</strong>,</p>
                <p>Your account password was changed successfully.</p>
                <p>If you did not perform this action, please reset your password immediately and contact support.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                <p style="font-size: 12px; color: #777; margin-bottom: 0;">
                  &copy; ${new Date().getFullYear()} DMYF Blood Bank.
                </p>
              </div>
            </div>
          `,
        }).catch((emailError) => {
          console.log("Password reset email failed:", emailError.message);
        });
      });
    }

    return res.status(200).send({
      success: true,
      message: "Profile updated successfully",

      user: sanitizeUser(user),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in profile update API",
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

        user: sanitizeUser(user),
      });
    }

    user.profileVerificationStatus = "pending";
    user.profileVerificationRequestedAt = new Date();
    await user.save();

    await notifyAdminsForVerificationRequest(user);

    return res.status(200).send({
      success: true,
      message: "Verification request submitted successfully",

      user: sanitizeUser(user),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error requesting profile verification",
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
  updateActivityController,
};




