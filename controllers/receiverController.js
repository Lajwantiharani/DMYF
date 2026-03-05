const InventoryModel = require("../models/InventoryModel");
const ReceiverRequestModel = require("../models/ReceiverRequestModel");
const userModel = require("../models/userModel");
const sendEmail = require("../client/src/utils/sendEmail");

const toDisplayName = (user) =>
  user?.name || user?.organizationName || user?.hospitalName || "User";

const sendBloodRequestEmails = async ({
  receiver,
  targetUser,
  bloodGroup,
  city,
  quantity,
}) => {
  const admins = await userModel.find({ role: "admin" }).select("email");
  const recipients = [
    ...admins.map((admin) => admin?.email).filter(Boolean),
    targetUser?.email,
  ].filter(Boolean);

  if (!recipients.length) return;

  const receiverName = toDisplayName(receiver);
  const targetName = toDisplayName(targetUser);

  await sendEmail({
    to: recipients.join(","),
    subject: "New Blood Request - DMYVF",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <h2>New Blood Request</h2>
        <p>A receiver has submitted a blood request.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Receiver</strong></td><td style="border:1px solid #ddd; padding:8px;">${receiverName}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Receiver Email</strong></td><td style="border:1px solid #ddd; padding:8px;">${receiver?.email || ""}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Target</strong></td><td style="border:1px solid #ddd; padding:8px;">${targetName}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Target Email</strong></td><td style="border:1px solid #ddd; padding:8px;">${targetUser?.email || ""}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Blood Group</strong></td><td style="border:1px solid #ddd; padding:8px;">${bloodGroup}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>City</strong></td><td style="border:1px solid #ddd; padding:8px;">${city || "-"}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Requested Quantity (ML)</strong></td><td style="border:1px solid #ddd; padding:8px;">${quantity}</td></tr>
        </table>
      </div>
    `,
  });
};

const sendAvailabilityRequestEmailToAdmins = async ({
  receiver,
  bloodGroup,
  quantity,
}) => {
  const admins = await userModel.find({ role: "admin" }).select("email");
  const adminEmails = admins.map((admin) => admin?.email).filter(Boolean);
  if (!adminEmails.length) return;

  await sendEmail({
    to: adminEmails.join(","),
    subject: "Receiver Availability Request - DMYVF",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <h2>Receiver Availability Request</h2>
        <p>A receiver requested blood availability from admin.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Name</strong></td><td style="border:1px solid #ddd; padding:8px;">${toDisplayName(receiver)}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Email</strong></td><td style="border:1px solid #ddd; padding:8px;">${receiver?.email || ""}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Nukh</strong></td><td style="border:1px solid #ddd; padding:8px;">${receiver?.nukh || "-"}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Blood Group</strong></td><td style="border:1px solid #ddd; padding:8px;">${bloodGroup}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Quantity (ML)</strong></td><td style="border:1px solid #ddd; padding:8px;">${quantity}</td></tr>
        </table>
      </div>
    `,
  });
};

const sendRequestStatusEmailToReceiver = async ({
  receiver,
  targetUser,
  status,
  bloodGroup,
  quantity,
  city,
}) => {
  if (!receiver?.email) return;

  const targetName = toDisplayName(targetUser);
  const statusText = status === "accepted" ? "Accepted" : "Rejected";

  await sendEmail({
    to: receiver.email,
    subject: `Blood Request ${statusText} - DMYVF`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <h2>Blood Request ${statusText}</h2>
        <p>Your blood request has been reviewed.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Receiver</strong></td><td style="border:1px solid #ddd; padding:8px;">${toDisplayName(receiver)}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Handled By</strong></td><td style="border:1px solid #ddd; padding:8px;">${targetName}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Blood Group</strong></td><td style="border:1px solid #ddd; padding:8px;">${bloodGroup}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Requested Quantity (ML)</strong></td><td style="border:1px solid #ddd; padding:8px;">${quantity}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>City</strong></td><td style="border:1px solid #ddd; padding:8px;">${city || "-"}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Status</strong></td><td style="border:1px solid #ddd; padding:8px;">${statusText}</td></tr>
        </table>
      </div>
    `,
  });
};

const searchAvailabilityController = async (req, res) => {
  try {
    const { bloodGroup, city } = req.body;
    const receiverId = req.body.userId;
    const receiver = await userModel.findById(receiverId).select("role");

    if (!receiver || receiver.role !== "receiver") {
      return res.status(403).send({
        success: false,
        message: "Only receivers can search availability",
      });
    }

    if (!bloodGroup || !city) {
      return res.status(400).send({
        success: false,
        message: "Blood group and city are required",
      });
    }

    const cityRegex = new RegExp(`^${city.trim()}$`, "i");

    const donors = await InventoryModel.aggregate([
      {
        $match: {
          inventoryType: "in",
          bloodGroup,
          donor: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$donor",
          availableQuantity: { $sum: "$quantity" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $match: {
          "user.role": "donor",
          "user.city": cityRegex,
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          name: "$user.name",
          contact: "$user.phone",
          email: "$user.email",
          city: "$user.city",
          availableQuantity: 1,
          type: { $literal: "donor" },
        },
      },
      { $sort: { name: 1 } },
    ]);

    const organizations = await InventoryModel.aggregate([
      {
        $match: {
          inventoryType: { $in: ["in", "out"] },
          bloodGroup,
          organization: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$organization",
          totalIn: {
            $sum: {
              $cond: [{ $eq: ["$inventoryType", "in"] }, "$quantity", 0],
            },
          },
          totalOut: {
            $sum: {
              $cond: [{ $eq: ["$inventoryType", "out"] }, "$quantity", 0],
            },
          },
        },
      },
      {
        $project: {
          organizationId: "$_id",
          availableQuantity: { $subtract: ["$totalIn", "$totalOut"] },
        },
      },
      { $match: { availableQuantity: { $gt: 0 } } },
      {
        $lookup: {
          from: "users",
          localField: "organizationId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $match: {
          "user.role": "organization",
          "user.city": cityRegex,
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          organizationName: "$user.organizationName",
          contact: "$user.phone",
          email: "$user.email",
          city: "$user.city",
          availableQuantity: 1,
          type: { $literal: "organization" },
        },
      },
      { $sort: { organizationName: 1 } },
    ]);

    const targetIds = [
      ...donors.map((item) => item.userId),
      ...organizations.map((item) => item.userId),
    ];

    const sentRequests = targetIds.length
      ? await ReceiverRequestModel.find({
          receiver: receiverId,
          requestType: "blood_request",
          targetUser: { $in: targetIds },
        }).select("targetUser")
      : [];

    const sentMap = new Set(
      sentRequests.map((request) => String(request.targetUser)),
    );

    return res.status(200).send({
      success: true,
      message: "Availability results fetched successfully",
      donors: donors.map((item) => ({
        ...item,
        requestSent: sentMap.has(String(item.userId)),
      })),
      organizations: organizations.map((item) => ({
        ...item,
        requestSent: sentMap.has(String(item.userId)),
      })),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error while searching availability",
      error: error.message,
    });
  }
};

const sendBloodRequestController = async (req, res) => {
  try {
    const { targetUserId, targetType, bloodGroup, city } = req.body;
    const quantity = Number(req.body.quantity);
    const receiverId = req.body.userId;

    if (!targetUserId || !targetType || !bloodGroup || !quantity) {
      return res.status(400).send({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!["donor", "organization"].includes(targetType)) {
      return res.status(400).send({
        success: false,
        message: "Invalid target type",
      });
    }
    if (quantity <= 0) {
      return res.status(400).send({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const receiver = await userModel.findById(receiverId);
    if (!receiver || receiver.role !== "receiver") {
      return res.status(403).send({
        success: false,
        message: "Only receivers can send this request",
      });
    }

    const targetUser = await userModel.findById(targetUserId);
    if (!targetUser || targetUser.role !== targetType) {
      return res.status(404).send({
        success: false,
        message: "Selected target not found",
      });
    }

    const duplicate = await ReceiverRequestModel.findOne({
      receiver: receiverId,
      requestType: "blood_request",
      targetUser: targetUserId,
    });

    if (duplicate) {
      return res.status(409).send({
        success: false,
        message: "Request already sent to this user",
      });
    }

    await ReceiverRequestModel.create({
      requestType: "blood_request",
      receiver: receiverId,
      targetUser: targetUserId,
      targetType,
      bloodGroup,
      city: city || "",
      quantity,
      status: "pending",
    });

    await sendBloodRequestEmails({
      receiver,
      targetUser,
      bloodGroup,
      city,
      quantity,
    });

    return res.status(201).send({
      success: true,
      message: "Request sent. Please wait for email confirmation.",
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).send({
        success: false,
        message: "Request already sent to this user",
      });
    }

    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error while sending blood request",
      error: error.message,
    });
  }
};

const requestAvailabilityController = async (req, res) => {
  try {
    const { bloodGroup } = req.body;
    const quantity = Number(req.body.quantity);
    const receiverId = req.body.userId;

    if (!bloodGroup || !quantity) {
      return res.status(400).send({
        success: false,
        message: "Blood group and quantity are required",
      });
    }
    if (quantity <= 0) {
      return res.status(400).send({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const receiver = await userModel.findById(receiverId);
    if (!receiver || receiver.role !== "receiver") {
      return res.status(403).send({
        success: false,
        message: "Only receivers can send this request",
      });
    }

    await ReceiverRequestModel.create({
      requestType: "availability_request",
      receiver: receiverId,
      targetUser: null,
      targetType: "admin",
      bloodGroup,
      city: receiver.city || "",
      quantity,
      status: "pending",
    });

    await sendAvailabilityRequestEmailToAdmins({
      receiver,
      bloodGroup,
      quantity,
    });

    return res.status(201).send({
      success: true,
      message: "Request sent successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error while requesting availability",
      error: error.message,
    });
  }
};

const getSentTargetsController = async (req, res) => {
  try {
    const requests = await ReceiverRequestModel.find({
      receiver: req.body.userId,
      requestType: "blood_request",
      targetUser: { $ne: null },
    }).select("targetUser");

    return res.status(200).send({
      success: true,
      targetUserIds: requests.map((item) => String(item.targetUser)),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error fetching sent request targets",
      error: error.message,
    });
  }
};

const getIncomingRequestsController = async (req, res) => {
  try {
    const currentUser = await userModel.findById(req.body.userId).select("role");
    if (!currentUser || !["donor", "organization"].includes(currentUser.role)) {
      return res.status(403).send({
        success: false,
        message: "Only donor or organization can view incoming requests",
      });
    }

    const requests = await ReceiverRequestModel.find({
      requestType: "blood_request",
      targetUser: req.body.userId,
    })
      .populate("receiver", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).send({
      success: true,
      message: "Incoming blood requests fetched successfully",
      requests,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error fetching incoming blood requests",
      error: error.message,
    });
  }
};

const updateIncomingRequestStatusController = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;
    const userId = req.body.userId;

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).send({
        success: false,
        message: "Invalid action",
      });
    }

    const currentUser = await userModel.findById(userId);
    if (!currentUser || !["donor", "organization"].includes(currentUser.role)) {
      return res.status(403).send({
        success: false,
        message: "Only donor or organization can update request status",
      });
    }

    const request = await ReceiverRequestModel.findOne({
      _id: requestId,
      requestType: "blood_request",
      targetUser: userId,
    }).populate("receiver", "name email phone");

    if (!request) {
      return res.status(404).send({
        success: false,
        message: "Request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).send({
        success: false,
        message: "This request has already been processed",
      });
    }

    request.status = action === "accept" ? "accepted" : "rejected";
    await request.save();

    await sendRequestStatusEmailToReceiver({
      receiver: request.receiver,
      targetUser: currentUser,
      status: request.status,
      bloodGroup: request.bloodGroup,
      quantity: request.quantity,
      city: request.city,
    });

    return res.status(200).send({
      success: true,
      message:
        request.status === "accepted"
          ? "Request accepted successfully"
          : "Request rejected successfully",
      request,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error updating request status",
      error: error.message,
    });
  }
};

module.exports = {
  searchAvailabilityController,
  sendBloodRequestController,
  requestAvailabilityController,
  getSentTargetsController,
  getIncomingRequestsController,
  updateIncomingRequestStatusController,
};
