const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../client/src/utils/sendEmail");
const generateOTP = require("../client/src/utils/generateOTP");
const { mapUserPublic } = require("../utils/serialize");
const {
  isValidEmail,
  isValidBloodGroup,
  normalizeBloodGroup,
  hasValue,
  escapeHtml,
} = require("../utils/validation");

const sanitizeUser = (user) => mapUserPublic(user);

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
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { email: true },
    });
    const adminEmails = admins
      .map((admin) => admin?.email)
      .filter((email) => hasValue(email));

    if (!adminEmails.length) {
      console.log("No admin email found for verification request notification");
      return false;
    }

    const displayName = escapeHtml(getDisplayNameForRole(requestUser) || "Unknown User");
    const requestedAt = requestUser?.profileVerificationRequestedAt
      ? new Date(requestUser.profileVerificationRequestedAt).toLocaleString()
      : new Date().toLocaleString();
    const requestEmail = escapeHtml(requestUser?.email || "");
    const requestRole = escapeHtml(requestUser?.role || "");
    const requestUserId = escapeHtml(requestUser?.id || requestUser?._id || "");
    const safeRequestedAt = escapeHtml(requestedAt);

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
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #eee;">${requestEmail}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Role</strong></td><td style="padding: 8px; border: 1px solid #eee;">${requestRole}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>User ID</strong></td><td style="padding: 8px; border: 1px solid #eee;">${requestUserId}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Requested At</strong></td><td style="padding: 8px; border: 1px solid #eee;">${safeRequestedAt}</td></tr>
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

    // Validate blood group when provided
    if (bloodGroup && !isValidBloodGroup(bloodGroup)) {
      return res.status(400).send({ success: false, message: "Invalid blood group" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).send({
        success: false,
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role,
        name: name || null,
        organizationName: organizationName || null,
        phone: phone || null,
        bloodGroup: bloodGroup ? normalizeBloodGroup(bloodGroup) : "",
        isVerified: false,
        otp: hashOtp(otp),
        otpExpires,
      },
    });

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
      await prisma.user.delete({ where: { id: user.id } });
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
      userId: user.id,
    });
  } catch (error) {
    console.log(error);
    if (error?.code === "P2002") {
      return res.status(409).send({
        success: false,
        message: "User already exists",
      });
    }
    res.status(500).send({
      success: false,
      message: "Error in Register API",
    });
  }
};

const loginController = async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).send({
        success: false,
        message: "Invalid Credentials",
      });
    }

    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword) {
      return res.status(401).send({
        success: false,
        message: "Invalid Credentials",
      });
    }

    if (!user.isVerified) {
      return res.status(403).send({
        success: false,
        message: "Please verify your email first.",
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

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
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In Login API",
    });
  }
};

const currentUserController = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.body.userId },
      data: { lastActiveAt: new Date() },
    }).catch(async () => {
      return prisma.user.findUnique({ where: { id: req.body.userId } });
    });

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
    await prisma.user.update({
      where: { id: req.body.userId },
      data: { lastActiveAt: new Date() },
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

    const user = await prisma.user.findUnique({ where: { email } });
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

    const otpFromReq = String(otp).trim();

    if (!user.otp || !otpMatches(user.otp, otpFromReq)) {
      return res.status(400).send({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).send({
        success: false,
        message: "OTP has expired. Please register again.",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otp: null,
        otpExpires: null,
      },
    });

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

    const user = await prisma.user.findUnique({ where: { email } });
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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: hashOtp(otp),
        otpExpires: new Date(Date.now() + 10 * 60 * 1000),
        forgotPasswordRequestedAt: new Date(),
      },
    });

    const clientBaseUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetUrl = `${clientBaseUrl}/reset-password?email=${encodeURIComponent(email)}`;
    const displayName = escapeHtml(getDisplayNameForRole(user) || "User");

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

    const user = await prisma.user.findUnique({ where: { email } });
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
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpires: null,
      },
    });

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

    const user = await prisma.user.findUnique({ where: { id: req.body.userId } });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    const data = {};

    if (email && email !== user.email) {
      const normalizedNewEmail = email.trim().toLowerCase();
      const existingUser = await prisma.user.findFirst({
        where: {
          email: normalizedNewEmail,
          NOT: { id: user.id },
        },
      });
      if (existingUser) {
        return res.status(400).send({
          success: false,
          message: "Email already in use",
        });
      }
      data.email = normalizedNewEmail;
    }

    if (typeof name === "string") {
      if (user.role === "organization") {
        data.organizationName = name;
      } else {
        data.name = name;
      }
    }

    if (typeof phone === "string") data.phone = phone;
    if (typeof city === "string") data.city = city;
    if (typeof address === "string") data.address = address;
    if (typeof bloodGroup === "string") {
      if (bloodGroup && !isValidBloodGroup(bloodGroup)) {
        return res.status(400).send({ success: false, message: "Invalid blood group" });
      }
      data.bloodGroup = bloodGroup ? normalizeBloodGroup(bloodGroup) : bloodGroup;
    }
    if (typeof nukh === "string") data.nukh = nukh;
    if (typeof akaah === "string") data.akaah = akaah;
    if (typeof website === "string") data.website = website;

    if (typeof dob === "string") {
      if (dob.includes("T") && dob.includes("Z")) {
        const dateObj = new Date(dob);
        if (!isNaN(dateObj.getTime())) {
          const day = String(dateObj.getDate()).padStart(2, "0");
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const year = dateObj.getFullYear();
          data.dob = `${day}/${month}/${year}`;
        }
      } else {
        data.dob = dob;
      }
    }

    if (newPassword || confirmPassword) {
      // Require current password to authorize a password change.
      const currentPassword = req.body.currentPassword;
      if (!currentPassword) {
        return res.status(400).send({
          success: false,
          message: "Current password is required to change password",
        });
      }

      const passwordValid = await bcrypt.compare(currentPassword, user.password);
      if (!passwordValid) {
        return res.status(403).send({
          success: false,
          message: "Current password is incorrect",
        });
      }

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
      data.password = await bcrypt.hash(newPassword, salt);
      isPasswordUpdated = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
    });

    if (isPasswordUpdated) {
      const displayName = escapeHtml(
        updatedUser.name || updatedUser.organizationName || "User",
      );

      process.nextTick(() => {
        sendEmail({
          to: updatedUser.email,
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
      user: sanitizeUser(updatedUser),
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
    const user = await prisma.user.findUnique({ where: { id: req.body.userId } });
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

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        profileVerificationStatus: "pending",
        profileVerificationRequestedAt: new Date(),
      },
    });

    await notifyAdminsForVerificationRequest(updatedUser);

    return res.status(200).send({
      success: true,
      message: "Verification request submitted successfully",
      user: sanitizeUser(updatedUser),
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
