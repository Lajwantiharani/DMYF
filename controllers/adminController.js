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
    hospitalName: user.hospitalName || "",
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
      record?.organization?.hospitalName ||
      "",
    donatedByEmail: record?.organization?.email || "",
    donatedByPhone: record?.organization?.phone || "",
    donatedByCity: record?.organization?.city || "",
    donatedByAddress: record?.organization?.address || "",
    donatedByBloodGroup: record?.organization?.bloodGroup || "",
    donatedByNukh: record?.organization?.nukh || "",
    donatedByAkaah: record?.organization?.akaah || "",
    donatedByIsVerified: record?.organization?.isVerified ? "Yes" : "No",
    receiverRole: record?.hospital?.role || "",
    receiverName:
      record?.hospital?.name ||
      record?.hospital?.organizationName ||
      record?.hospital?.hospitalName ||
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
      error,
    });
  }
};
//GET HOSPITAL LIST
const getHospitalListController = async (req, res) => {
  try {
    const hospitalData = await userModel
      .find({ role: "hospital" })
      .sort({ createdAt: -1 });

    return res.status(200).send({
      success: true,
      Toatlcount: hospitalData.length,
      message: "HOSPITAL List Fetched Successfully",
      hospitalData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Hospital List API",
      error,
    });
  }
};
//GET ORG LIST
const getOrgListController = async (req, res) => {
  try {
    const orgData = await userModel
      .find({ role: "organization" })
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
      error,
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
      error,
    });
  }
};




const getReceiverListController = async (req, res) => {
  try {
    const receiverData = await userModel
      .find({ role: "receiver" })
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
      error,
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
      error,
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
      error,
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
      error,
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
      error,
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
        "role name organizationName hospitalName email phone city address bloodGroup nukh akaah isVerified",
      )
      .populate(
        "hospital",
        "role name organizationName hospitalName email phone city address bloodGroup nukh akaah isVerified",
      )
      .sort({ createdAt: -1 });

    const rows = mapDonatedRecordsForExport(donatedRecords);
    return sendExcel(res, rows, "Donated", "donated-data");
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error exporting donated data",
      error,
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
      error,
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
      error,
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
        user.name || user.organizationName || user.hospitalName || "User";
      try {
        await sendEmail({
          to: user.email,
          subject: "Profile Verification Approved - DMYVF",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #2c3e50;">Profile Verified Successfully</h2>
              <p>Hello ${displayName},</p>
              <p>Your profile has been verified by the admin.</p>
              <p>You can now access all tabs and features in your account.</p>
              <hr style="border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #777;">
                &copy; ${new Date().getFullYear()} ${process.env.APP_NAME || "DMYVF"}.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.log("Verification approval email failed:", emailError.message);
      }
    }

    return res.status(200).send({
      success: true,
      message:
        action === "verify"
          ? "User verified successfully"
          : "User marked as not verified",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error updating profile verification status",
      error,
    });
  }
};
//EXPORT
module.exports = {
  getDonorsListController,
  getHospitalListController,
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
};
