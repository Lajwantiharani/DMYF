const userModel = require("../models/userModel");
const InventoryModel = require("../models/InventoryModel");
const XLSX = require("xlsx");
const sendEmail = require("../client/src/utils/sendEmail");

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
  return { createdAt: { $gte: start, $lte: end } };
};

const mapUsersForExport = (users) =>
  users.map((user) => ({
    id: user._id?.toString() || "",
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
    donationId: record._id?.toString() || "",
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
    const donorData = await userModel
      .find({ role: "donor" })

      .select("-password -otp -otpExpires -forgotPasswordRequestedAt")
      .sort({ createdAt: -1 });

    return res.status(200).send({
      success: true,
      Toatlcount: donorData.length,
      message: "Donor List Fetched Successfully",
      donorData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In DOnor List API",

      error: error.message,
    });
  }
};

//GET ORG LIST
const getOrgListController = async (req, res) => {
  try {
    const orgData = await userModel
      .find({ role: "organization" })

      .select("-password -otp -otpExpires -forgotPasswordRequestedAt")
      .sort({ createdAt: -1 });

    return res.status(200).send({
      success: true,
      Toatlcount: orgData.length,
      message: "ORG List Fetched Successfully",
      orgData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In ORG List API",

      error: error.message,
    });
  }
};
// =======================================

//DELETE DONAR
const deleteDonorController = async (req, res) => {
  try {
    await userModel.findByIdAndDelete(req.params.id);
    return res.status(200).send({
      success: true,
      message: " Record Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error while deleting ",

      error: error.message,
    });
  }
};




const getReceiverListController = async (req, res) => {
  try {
    const receiverData = await userModel
      .find({ role: "receiver" })

      .select("-password -otp -otpExpires -forgotPasswordRequestedAt")
      .sort({ createdAt: -1 });

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

      error: error.message,
    });
  }
};

// ADD RECEIVER RECORD
const addReceiverController = async (req, res) => {
  try {
    const { name, email, phone, address, bloodGroup } = req.body;
    const newReceiver = new userModel({
      name,
      email,
      phone,
      address,
      bloodGroup,
      role: "receiver",
    });
    await newReceiver.save();

    return res.status(200).send({
      success: true,
      message: "Receiver Record Added Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error Adding Receiver Record",

      error: error.message,
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

    const filter = { role: "donor", ...(dateFilter || {}) };
    const donors = await userModel.find(filter).sort({ createdAt: -1 });
    const rows = mapUsersForExport(donors);

    return sendExcel(res, rows, "Donors", "donors-data");
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error exporting donor data",

      error: error.message,
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

    const filter = { role: "organization", ...(dateFilter || {}) };
    const organizations = await userModel.find(filter).sort({ createdAt: -1 });
    const rows = mapUsersForExport(organizations);

    return sendExcel(res, rows, "Organizations", "organizations-data");
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error exporting organization data",

      error: error.message,
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

    const filter = { role: "receiver", ...(dateFilter || {}) };
    const receivers = await userModel.find(filter).sort({ createdAt: -1 });
    const rows = mapUsersForExport(receivers);

    return sendExcel(res, rows, "Receivers", "receivers-data");
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error exporting receiver data",

      error: error.message,
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

    const filter = { inventoryType: "out", ...(dateFilter || {}) };
    const donatedRecords = await InventoryModel.find(filter)
      .populate(
        "organization",
        "role name organizationName email phone city address bloodGroup nukh akaah isVerified",
      )
      .populate(
        "hospital",
        "role name organizationName email phone city address bloodGroup nukh akaah isVerified",
      )
      .sort({ createdAt: -1 });

    const rows = mapDonatedRecordsForExport(donatedRecords);
    return sendExcel(res, rows, "Donated", "donated-data");
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error exporting donated data",

      error: error.message,
    });
  }
};

const deleteReceiverController = async (req, res) => {
  try {
    await userModel.findOneAndDelete({ _id: req.params.id, role: "receiver" });
    return res.status(200).send({
      success: true,
      message: "Receiver deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error while deleting receiver",

      error: error.message,
    });
  }
};

const getPendingVerificationUsersController = async (req, res) => {
  try {
    const users = await userModel
      .find({
        role: { $ne: "admin" },
        profileVerificationStatus: "pending",
      })
      .sort({ profileVerificationRequestedAt: -1, createdAt: -1 });

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

      error: error.message,
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

    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(400).send({
        success: false,
        message: "Admin account is not eligible for this action",
      });
    }

    user.profileVerificationStatus =
      action === "verify" ? "approved" : "rejected";
    await user.save();

    if (action === "verify") {
      const displayName =
        user.name || user.organizationName || "User";
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
                <p>You can now access all tabs and features in your account.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                <p style="font-size: 12px; color: #777; margin-bottom: 0;">
                  &copy; ${new Date().getFullYear()} DMYF Blood Bank.
                </p>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.log("Verification approval email failed:", emailError.message);
      }
    } else {
      // Profile rejected
      const displayName =
        user.name || user.organizationName || "User";
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
        console.log("Verification rejection email failed:", emailError.message);
      }
    }

    return res.status(200).send({
      success: true,
      message:
        action === "verify"
          ? "User verified successfully"
          : "User marked as not verified",

      user: {
        ...user.toObject(),
        password: undefined,
        otp: undefined,
        otpExpires: undefined,
        forgotPasswordRequestedAt: undefined,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error updating profile verification status",

      error: error.message,
    });
  }
};

const getDashboardStatsController = async (req, res) => {
  try {
    const activeWindowMs = 2 * 60 * 1000;
    const activeSince = new Date(Date.now() - activeWindowMs);

    const [registeredUsers, activeUsers] = await Promise.all([
      userModel.countDocuments({ role: { $ne: "admin" } }),
      userModel.countDocuments({
        role: { $ne: "admin" },
        lastActiveAt: { $gte: activeSince },
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
      error: error.message,
    });
  }
};
//EXPORT
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
