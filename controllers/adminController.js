const prisma = require("../config/prisma");
const { mapUserPublic } = require("../utils/serialize");
const { isValidEmail, isValidBloodGroup, normalizeBloodGroup, escapeHtml, hasValue } = require("../utils/validation");
const XLSX = require("xlsx");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../client/src/utils/sendEmail");

const USER_PUBLIC_SELECT = {
  id: true,
  role: true,
  name: true,
  organizationName: true,
  email: true,
  website: true,
  address: true,
  phone: true,
  city: true,
  bloodGroup: true,
  nukh: true,
  akaah: true,
  dob: true,
  profileVerificationStatus: true,
  profileVerificationRequestedAt: true,
  isVerified: true,
  lastActiveAt: true,
  createdAt: true,
  updatedAt: true,
};

const USER_RELATION_SELECT = {
  id: true,
  role: true,
  name: true,
  organizationName: true,
  email: true,
  phone: true,
  city: true,
  address: true,
  bloodGroup: true,
  nukh: true,
  akaah: true,
  isVerified: true,
};

const buildDateFilter = (startDate, endDate) => {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { error: "Invalid date range" };
  }

  if (start > end) {
    return { error: "Start date cannot be after end date" };
  }

  end.setHours(23, 59, 59, 999);
  return {
    createdAt: {
      gte: start,
      lte: end,
    },
  };
};

const mapUsersForExport = (users) =>
  users.map((user) => ({
    _id: user.id || "",
    role: user.role || "",
    name: user.name || "",
    organizationName: user.organizationName || "",
    email: user.email || "",
    phone: user.phone || "",
    city: user.city || "",
    address: user.address || "",
    website: user.website || "",
    bloodGroup: user.bloodGroup || "",
    nukh: user.nukh || "",
    akaah: user.akaah || "",
    isVerified: user.isVerified ? "Yes" : "No",
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : "",
    updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : "",
  }));

const mapDonatedRecordsForExport = (records) =>
  records.map((record) => ({
    donationId: record.id || "",
    inventoryType: record.inventoryType || "",
    bloodGroup: record.bloodGroup || "",
    quantityML: record.quantity || 0,
    createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : "",
    updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : "",
    donatedByRole: record?.organization?.role || "",
    donatedByName:
      record?.organization?.name ||
      record?.organization?.organizationName ||
      "",
    donatedByEmail: record?.organization?.email || "",
    donatedByPhone: record?.organization?.phone || "",
    donatedByCity: record?.organization?.city || "",
    donatedByAddress: record?.organization?.address || "",
    donatedByBloodGroup: record?.organization?.bloodGroup || "",
    donatedByNukh: record?.organization?.nukh || "",
    donatedByAkaah: record?.organization?.akaah || "",
    receiverRole: record?.hospital?.role || "",
    receiverName:
      record?.hospital?.name ||
      record?.hospital?.organizationName ||
      "",
    receiverEmail: record?.hospital?.email || "",
    receiverPhone: record?.hospital?.phone || "",
    receiverCity: record?.hospital?.city || "",
    receiverAddress: record?.hospital?.address || "",
    receiverBloodGroup: record?.hospital?.bloodGroup || "",
    receiverNukh: record?.hospital?.nukh || "",
    receiverAkaah: record?.hospital?.akaah || "",
    receiverIsVerified: record?.hospital?.isVerified ? "Yes" : "No",
  }));

const sendExcel = (res, rows, sheetName, filePrefix) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const stamp = new Date().toISOString().slice(0, 10);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=\"${filePrefix}-${stamp}.xlsx\"`,
  );

  return res.status(200).send(buffer);
};

const getDonorsListController = async (req, res) => {
  try {
    const donors = await prisma.user.findMany({
      where: { role: "donor" },
      select: USER_PUBLIC_SELECT,
      orderBy: { createdAt: "desc" },
    });
    const donorData = donors.map(mapUserPublic);

    return res.status(200).send({
      success: true,
      totalCount: donorData.length,
      message: "Donor List Fetched Successfully",
      donorData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In DOnor List API",
    });
  }
};

const getOrgListController = async (req, res) => {
  try {
    const orgs = await prisma.user.findMany({
      where: { role: "organization" },
      select: USER_PUBLIC_SELECT,
      orderBy: { createdAt: "desc" },
    });
    const orgData = orgs.map(mapUserPublic);

    return res.status(200).send({
      success: true,
      totalCount: orgData.length,
      message: "ORG List Fetched Successfully",
      orgData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In ORG List API",
    });
  }
};

const deleteDonorController = async (req, res) => {
  try {
    const deleted = await prisma.user.deleteMany({
      where: {
        id: req.params.id,
        role: "donor",
      },
    });

    if (deleted.count === 0) {
      return res.status(404).send({
        success: false,
        message: "Donor not found",
      });
    }

    return res.status(200).send({
      success: true,
      message: " Record Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error while deleting ",
    });
  }
};

const getReceiverListController = async (req, res) => {
  try {
    const receivers = await prisma.user.findMany({
      where: { role: "receiver" },
      select: USER_PUBLIC_SELECT,
      orderBy: { createdAt: "desc" },
    });
    const receiverData = receivers.map(mapUserPublic);

    return res.status(200).send({
      success: true,
      TotalCount: receiverData.length,
      message: "Receiver List Fetched Successfully",
      receiverData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Receiver List API",
    });
  }
};

const addReceiverController = async (req, res) => {
  try {
    const { name, email, phone, address, bloodGroup } = req.body;

    if (!hasValue(name)) {
      return res.status(400).send({
        success: false,
        message: "Name is required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).send({
        success: false,
        message: "Valid email is required",
      });
    }

    if (bloodGroup && !isValidBloodGroup(bloodGroup)) {
      return res.status(400).send({
        success: false,
        message: "Invalid blood group",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return res.status(409).send({
        success: false,
        message: "Email already in use",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      crypto.randomBytes(12).toString("base64url"),
      salt,
    );

    await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone ? phone.trim() : "",
        address: address ? address.trim() : "",
        bloodGroup: bloodGroup ? normalizeBloodGroup(bloodGroup) : "",
        role: "receiver",
        password: hashedPassword,
        isVerified: true,
      },
    });

    return res.status(200).send({
      success: true,
      message: "Receiver Record Added Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error Adding Receiver Record",
    });
  }
};

const exportDonorsExcelController = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);

    if (dateFilter?.error) {
      return res.status(400).send({
        success: false,
        message: dateFilter.error,
      });
    }

    const donors = await prisma.user.findMany({
      where: {
        role: "donor",
        ...(dateFilter || {}),
      },
      select: USER_PUBLIC_SELECT,
      orderBy: { createdAt: "desc" },
    });
    const rows = mapUsersForExport(donors);

    return sendExcel(res, rows, "Donors", "donors-data");
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error exporting donor data",
    });
  }
};

const exportOrganizationsExcelController = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);

    if (dateFilter?.error) {
      return res.status(400).send({
        success: false,
        message: dateFilter.error,
      });
    }

    const organizations = await prisma.user.findMany({
      where: {
        role: "organization",
        ...(dateFilter || {}),
      },
      select: USER_PUBLIC_SELECT,
      orderBy: { createdAt: "desc" },
    });
    const rows = mapUsersForExport(organizations);

    return sendExcel(res, rows, "Organizations", "organizations-data");
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error exporting organization data",
    });
  }
};

const exportReceiversExcelController = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);

    if (dateFilter?.error) {
      return res.status(400).send({
        success: false,
        message: dateFilter.error,
      });
    }

    const receivers = await prisma.user.findMany({
      where: {
        role: "receiver",
        ...(dateFilter || {}),
      },
      select: USER_PUBLIC_SELECT,
      orderBy: { createdAt: "desc" },
    });
    const rows = mapUsersForExport(receivers);

    return sendExcel(res, rows, "Receivers", "receivers-data");
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error exporting receiver data",
    });
  }
};

const exportDonatedExcelController = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);

    if (dateFilter?.error) {
      return res.status(400).send({
        success: false,
        message: dateFilter.error,
      });
    }

    const donatedRecords = await prisma.inventory.findMany({
      where: {
        inventoryType: "out",
        ...(dateFilter || {}),
      },
      include: {
        organization: { select: USER_RELATION_SELECT },
        hospital: { select: USER_RELATION_SELECT },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = mapDonatedRecordsForExport(donatedRecords);
    return sendExcel(res, rows, "Donated", "donated-data");
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error exporting donated data",
    });
  }
};

const deleteReceiverController = async (req, res) => {
  try {
    const deleted = await prisma.user.deleteMany({
      where: {
        id: req.params.id,
        role: "receiver",
      },
    });

    if (deleted.count === 0) {
      return res.status(404).send({
        success: false,
        message: "Receiver not found",
      });
    }

    return res.status(200).send({
      success: true,
      message: "Receiver deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error while deleting receiver",
    });
  }
};

const getPendingVerificationUsersController = async (req, res) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: {
        role: { not: "admin" },
        profileVerificationStatus: "pending",
      },
      select: USER_PUBLIC_SELECT,
      orderBy: [
        { profileVerificationRequestedAt: "desc" },
        { createdAt: "desc" },
      ],
    });
    const users = pendingUsers.map(mapUserPublic);

    return res.status(200).send({
      success: true,
      totalCount: users.length,
      message: "Pending verification users fetched successfully",
      users,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error fetching pending verification users",
    });
  }
};

const updateProfileVerificationStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!["verify", "not_verify"].includes(action)) {
      return res.status(400).send({
        success: false,
        message: "Invalid action",
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    if (existingUser.role === "admin") {
      return res.status(400).send({
        success: false,
        message: "Admin account is not eligible for this action",
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        profileVerificationStatus:
          action === "verify" ? "approved" : "rejected",
      },
      select: USER_PUBLIC_SELECT,
    });

    if (action === "verify") {
      const displayName = escapeHtml(user.name || user.organizationName || "User");
      try {
        await sendEmail({
          to: user.email,
          subject: "Profile Verification Approved - DMYF",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #b4232b; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">DMYF</h1>
              </div>
              <div style="padding: 30px; color: #333; line-height: 1.6;">
                <h2 style="color: #2c3e50; margin-top: 0;">Profile Verified Successfully</h2>
                <p>Hello <strong>${displayName}</strong>,</p>
                <p>Your profile has been verified by the admin.</p>
                <p>You can now access the features in your account.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                <p style="font-size: 12px; color: #777; margin-bottom: 0;">
                  &copy; ${new Date().getFullYear()} DMYF Blood Bank.
                </p>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.log("Verification approval email failed:", emailError);
      }
    } else {
      const displayName = escapeHtml(user.name || user.organizationName || "User");
      try {
        await sendEmail({
          to: user.email,
          subject: "Profile Verification Rejected - DMYF",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #b4232b; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">DMYF</h1>
              </div>
              <div style="padding: 30px; color: #333; line-height: 1.6;">
                <h2 style="color: #dc3545; margin-top: 0;">Profile Verification Rejected</h2>
                <p>Hello <strong>${displayName}</strong>,</p>
                <p>Your profile verification request has been rejected.</p>
                <p>Your profile is currently locked. Please contact the admin for more information about the reason for rejection.</p>
                <p>You may update your profile and resubmit for verification after consulting with the admin.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                <p style="font-size: 12px; color: #777; margin-bottom: 0;">
                  &copy; ${new Date().getFullYear()} DMYF Blood Bank.
                </p>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.log("Verification rejection email failed:", emailError);
      }
    }

    return res.status(200).send({
      success: true,
      message:
        action === "verify"
          ? "User verified successfully"
          : "User marked as not verified",
      user: mapUserPublic(user),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error updating profile verification status",
    });
  }
};

const getDashboardStatsController = async (req, res) => {
  try {
    const activeWindowMs = 2 * 60 * 1000;
    const activeSince = new Date(Date.now() - activeWindowMs);

    const [registeredUsers, activeUsers] = await Promise.all([
      prisma.user.count({ where: { role: { not: "admin" } } }),
      prisma.user.count({
        where: {
          role: { not: "admin" },
          lastActiveAt: { gte: activeSince },
        },
      }),
    ]);

    return res.status(200).send({
      success: true,
      message: "Dashboard stats fetched successfully",
      stats: {
        registeredUsers,
        activeUsers,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error fetching dashboard stats",
    });
  }
};

module.exports = {
  getDonorsListController,
  getOrgListController,
  deleteDonorController,
  getReceiverListController,
  addReceiverController,
  exportDonorsExcelController,
  exportOrganizationsExcelController,
  exportReceiversExcelController,
  exportDonatedExcelController,
  deleteReceiverController,
  getPendingVerificationUsersController,
  updateProfileVerificationStatusController,
  getDashboardStatsController,
};
