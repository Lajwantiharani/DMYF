const prisma = require("../config/prisma");
const sendEmail = require("../client/src/utils/sendEmail");
const { mapReceiverRequest } = require("../utils/serialize");
const {
  isValidBloodGroup,
  normalizeBloodGroup,
  escapeHtml,
} = require("../utils/validation");

const toDisplayName = (user) =>
  user?.name || user?.organizationName || "User";

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeCity = (value = "") =>
  value.toLowerCase().replace(/[^a-z]/g, "");

const cityAliasGroups = [
  ["karachi", "khi"],
  ["hyderabad", "hyd", "hyderabaad"],
  ["lahore", "lahor"],
];

const buildCityRegex = (inputCity = "") => {
  const raw = String(inputCity || "").trim();
  const normalized = normalizeCity(raw);

  if (!normalized) return /.*/i;

  const aliasGroup = cityAliasGroups.find((group) => group.includes(normalized));
  const patterns = aliasGroup?.length ? aliasGroup : [raw];

  return new RegExp(`(${patterns.map((item) => escapeRegex(item)).join("|")})`, "i");
};

const aggregateAvailabilityByField = (rows, field) => {
  const totals = new Map();

  for (const row of rows) {
    const key = row[field];
    if (!key) continue;

    if (!totals.has(key)) {
      totals.set(key, { totalIn: 0, totalOut: 0 });
    }

    const entry = totals.get(key);
    if (row.inventoryType === "in") {
      entry.totalIn += row.quantity;
    } else if (row.inventoryType === "out") {
      entry.totalOut += row.quantity;
    }
  }

  return totals;
};

const getOrganizationAvailableQuantity = async ({ organizationId, bloodGroup }) => {
  const [totalIn, totalOut] = await Promise.all([
    prisma.inventory.aggregate({
      where: { organizationId, bloodGroup, inventoryType: "in" },
      _sum: { quantity: true },
    }),
    prisma.inventory.aggregate({
      where: { organizationId, bloodGroup, inventoryType: "out" },
      _sum: { quantity: true },
    }),
  ]);

  return Math.max(
    (totalIn._sum.quantity || 0) - (totalOut._sum.quantity || 0),
    0,
  );
};

const getDonorAvailableQuantity = async ({ donorId, bloodGroup }) => {
  const [totalIn, totalOut] = await Promise.all([
    prisma.inventory.aggregate({
      where: { donorId, bloodGroup, inventoryType: "in" },
      _sum: { quantity: true },
    }),
    prisma.inventory.aggregate({
      where: { donorId, bloodGroup, inventoryType: "out" },
      _sum: { quantity: true },
    }),
  ]);

  return Math.max(
    (totalIn._sum.quantity || 0) - (totalOut._sum.quantity || 0),
    0,
  );
};

const findDonorOrganizationForOut = async ({ donorId, bloodGroup }) => {
  const donation = await prisma.inventory.findFirst({
    where: {
      donorId,
      inventoryType: "in",
      bloodGroup,
    },
    orderBy: { createdAt: "desc" },
    select: { organizationId: true },
  });

  return donation?.organizationId || null;
};

const sendBloodRequestEmails = async ({
  receiver,
  targetUser,
  bloodGroup,
  city,
  quantity,
}) => {
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { email: true },
  });
  const recipients = [
    ...admins.map((admin) => admin?.email).filter(Boolean),
    targetUser?.email,
  ].filter(Boolean);

  if (!recipients.length) return;

  const receiverName = escapeHtml(toDisplayName(receiver));
  const targetName = escapeHtml(toDisplayName(targetUser));
  const receiverEmail = escapeHtml(receiver?.email || "");
  const targetEmail = escapeHtml(targetUser?.email || "");
  const safeBloodGroup = escapeHtml(bloodGroup);
  const safeCity = escapeHtml(city || "-");
  const safeQuantity = escapeHtml(String(quantity));

  await sendEmail({
    to: recipients.join(","),
    subject: "New Blood Request - DMYF",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <h2>New Blood Request</h2>
        <p>A receiver has submitted a blood request.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Receiver</strong></td><td style="border:1px solid #ddd; padding:8px;">${receiverName}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Receiver Email</strong></td><td style="border:1px solid #ddd; padding:8px;">${receiverEmail}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Target</strong></td><td style="border:1px solid #ddd; padding:8px;">${targetName}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Target Email</strong></td><td style="border:1px solid #ddd; padding:8px;">${targetEmail}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Blood Group</strong></td><td style="border:1px solid #ddd; padding:8px;">${safeBloodGroup}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>City</strong></td><td style="border:1px solid #ddd; padding:8px;">${safeCity}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Requested Quantity (ML)</strong></td><td style="border:1px solid #ddd; padding:8px;">${safeQuantity}</td></tr>
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
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { email: true },
  });
  const adminEmails = admins.map((admin) => admin?.email).filter(Boolean);
  if (!adminEmails.length) return;

  const safeName = escapeHtml(toDisplayName(receiver));
  const safeEmail = escapeHtml(receiver?.email || "");
  const safeNukh = escapeHtml(receiver?.nukh || "-");
  const safeBloodGroup = escapeHtml(bloodGroup);
  const safeQuantity = escapeHtml(String(quantity));

  await sendEmail({
    to: adminEmails.join(","),
    subject: "Receiver Availability Request - DMYF",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <h2>Receiver Availability Request</h2>
        <p>A receiver requested blood availability from admin.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Name</strong></td><td style="border:1px solid #ddd; padding:8px;">${safeName}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Email</strong></td><td style="border:1px solid #ddd; padding:8px;">${safeEmail}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Nukh</strong></td><td style="border:1px solid #ddd; padding:8px;">${safeNukh}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Blood Group</strong></td><td style="border:1px solid #ddd; padding:8px;">${safeBloodGroup}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Quantity (ML)</strong></td><td style="border:1px solid #ddd; padding:8px;">${safeQuantity}</td></tr>
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

  const targetName = escapeHtml(toDisplayName(targetUser));
  const receiverName = escapeHtml(toDisplayName(receiver));
  const statusText = status === "accepted" ? "Accepted" : "Rejected";
  const safeBloodGroup = escapeHtml(bloodGroup);
  const safeQuantity = escapeHtml(String(quantity));
  const safeCity = escapeHtml(city || "-");

  await sendEmail({
    to: receiver.email,
    subject: `Blood Request ${statusText} - DMYF`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <h2>Blood Request ${statusText}</h2>
        <p>Your blood request has been reviewed.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Receiver</strong></td><td style="border:1px solid #ddd; padding:8px;">${receiverName}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Handled By</strong></td><td style="border:1px solid #ddd; padding:8px;">${targetName}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Blood Group</strong></td><td style="border:1px solid #ddd; padding:8px;">${safeBloodGroup}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Requested Quantity (ML)</strong></td><td style="border:1px solid #ddd; padding:8px;">${safeQuantity}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>City</strong></td><td style="border:1px solid #ddd; padding:8px;">${safeCity}</td></tr>
          <tr><td style="border:1px solid #ddd; padding:8px;"><strong>Status</strong></td><td style="border:1px solid #ddd; padding:8px;">${statusText}</td></tr>
        </table>
      </div>
    `,
  });
};

const searchAvailabilityController = async (req, res) => {
  try {
    const { bloodGroup, city } = req.body;

    const minQuantity = Number(req.body.quantity || 0);
    const receiverId = req.body.userId;
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { role: true },
    });

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

    if (!isValidBloodGroup(bloodGroup)) {
      return res.status(400).send({
        success: false,
        message: "Invalid blood group",
      });
    }

    const cityRegex = buildCityRegex(city);

    const [donorInventory, organizationInventory] = await Promise.all([
      prisma.inventory.findMany({
        where: {
          bloodGroup,
          donorId: { not: null },
        },
        select: {
          donorId: true,
          inventoryType: true,
          quantity: true,
        },
      }),
      prisma.inventory.findMany({
        where: {
          bloodGroup,
          organizationId: { not: null },
        },
        select: {
          organizationId: true,
          inventoryType: true,
          quantity: true,
        },
      }),
    ]);

    const donorTotals = aggregateAvailabilityByField(donorInventory, "donorId");
    const organizationTotals = aggregateAvailabilityByField(
      organizationInventory,
      "organizationId",
    );

    const meetsQuantity = (availableQuantity) =>
      minQuantity > 0 ? availableQuantity >= minQuantity : availableQuantity > 0;

    const donorCandidates = [...donorTotals.entries()]
      .map(([donorId, { totalIn, totalOut }]) => ({
        donorId,
        availableQuantity: totalIn - totalOut,
      }))
      .filter(({ availableQuantity }) => meetsQuantity(availableQuantity));

    const organizationCandidates = [...organizationTotals.entries()]
      .map(([organizationId, { totalIn, totalOut }]) => ({
        organizationId,
        availableQuantity: totalIn - totalOut,
      }))
      .filter(({ availableQuantity }) => meetsQuantity(availableQuantity));

    const [donorUsers, organizationUsers] = await Promise.all([
      donorCandidates.length
        ? prisma.user.findMany({
            where: {
              id: { in: donorCandidates.map((item) => item.donorId) },
              role: "donor",
            },
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              city: true,
            },
          })
        : [],
      organizationCandidates.length
        ? prisma.user.findMany({
            where: {
              id: { in: organizationCandidates.map((item) => item.organizationId) },
              role: "organization",
            },
            select: {
              id: true,
              organizationName: true,
              phone: true,
              email: true,
              city: true,
            },
          })
        : [],
    ]);

    const donorAvailabilityMap = new Map(
      donorCandidates.map((item) => [item.donorId, item.availableQuantity]),
    );
    const organizationAvailabilityMap = new Map(
      organizationCandidates.map((item) => [
        item.organizationId,
        item.availableQuantity,
      ]),
    );

    const donors = donorUsers
      .filter((user) => cityRegex.test(user.city || ""))
      .map((user) => ({
        userId: user.id,
        name: user.name,
        contact: user.phone,
        email: user.email,
        city: user.city,
        availableQuantity: donorAvailabilityMap.get(user.id) || 0,
        type: "donor",
      }))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    const organizations = organizationUsers
      .filter((user) => cityRegex.test(user.city || ""))
      .map((user) => ({
        userId: user.id,
        organizationName: user.organizationName,
        contact: user.phone,
        email: user.email,
        city: user.city,
        availableQuantity: organizationAvailabilityMap.get(user.id) || 0,
        type: "organization",
      }))
      .sort((a, b) =>
        String(a.organizationName || "").localeCompare(String(b.organizationName || "")),
      );

    const targetIds = [
      ...donors.map((item) => item.userId),
      ...organizations.map((item) => item.userId),
    ];

    const requestDocs = targetIds.length
      ? await prisma.receiverRequest.findMany({
          where: {
            receiverId,
            requestType: "blood_request",
            targetUserId: { in: targetIds },
            bloodGroup,
          },
          select: {
            id: true,
            targetUserId: true,
            status: true,
          },
        })
      : [];

    const requestMap = new Map(
      requestDocs.map((request) => [
        String(request.targetUserId),
        { status: request.status, requestId: request.id },
      ]),
    );

    return res.status(200).send({
      success: true,
      message: "Availability results fetched successfully",
      donors: donors
        .filter(
          (item) =>
            !["accepted", "approved"].includes(
              requestMap.get(String(item.userId))?.status,
            ),
        )
        .map((item) => ({
          ...item,
          requestStatus: requestMap.get(String(item.userId))?.status || null,
          requestId: requestMap.get(String(item.userId))?.requestId || null,
        })),
      organizations: organizations
        .filter(
          (item) =>
            !["accepted", "approved"].includes(
              requestMap.get(String(item.userId))?.status,
            ),
        )
        .map((item) => ({
          ...item,
          requestStatus: requestMap.get(String(item.userId))?.status || null,
          requestId: requestMap.get(String(item.userId))?.requestId || null,
        })),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error while searching availability",
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

    if (!isValidBloodGroup(bloodGroup)) {
      return res.status(400).send({
        success: false,
        message: "Invalid blood group",
      });
    }

    if (quantity <= 0) {
      return res.status(400).send({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver || receiver.role !== "receiver") {
      return res.status(403).send({
        success: false,
        message: "Only receivers can send this request",
      });
    }

    const pendingCount = await prisma.receiverRequest.count({
      where: {
        receiverId,
        requestType: "blood_request",
        status: "pending",
      },
    });

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser || targetUser.role !== targetType) {
      return res.status(404).send({
        success: false,
        message: "Selected target not found",
      });
    }

    const duplicate = await prisma.receiverRequest.findFirst({
      where: {
        receiverId,
        requestType: "blood_request",
        targetUserId,
      },
    });

    if (duplicate) {
      if (duplicate.status === "rejected") {
        if (pendingCount >= 2) {
          return res.status(409).send({
            success: false,
            message:
              "You already have 2 pending requests. Please wait for a decision before sending a new request.",
          });
        }

        const updatedRequest = await prisma.receiverRequest.update({
          where: { id: duplicate.id },
          data: {
            status: "pending",
            bloodGroup,
            city: city || "",
            quantity,
          },
        });

        await sendBloodRequestEmails({
          receiver,
          targetUser,
          bloodGroup,
          city,
          quantity,
        });

        return res.status(200).send({
          success: true,
          message: "Request resent. Please wait for email confirmation.",
          request: mapReceiverRequest(updatedRequest),
        });
      }

      return res.status(409).send({
        success: false,
        message:
          duplicate.status === "pending"
            ? "Request already pending for this user"
            : "This request has already been processed",
      });
    }

    if (pendingCount >= 2) {
      return res.status(409).send({
        success: false,
        message:
          "You already have 2 pending requests. Please wait for a decision before sending a new request.",
      });
    }

    await prisma.receiverRequest.create({
      data: {
        requestType: "blood_request",
        receiverId,
        targetUserId,
        targetType,
        bloodGroup,
        city: city || "",
        quantity,
        status: "pending",
      },
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
    if (error?.code === "P2002") {
      return res.status(409).send({
        success: false,
        message: "Request already sent to this user",
      });
    }

    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error while sending blood request",
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

    if (!isValidBloodGroup(bloodGroup)) {
      return res.status(400).send({
        success: false,
        message: "Invalid blood group",
      });
    }

    if (quantity <= 0) {
      return res.status(400).send({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver || receiver.role !== "receiver") {
      return res.status(403).send({
        success: false,
        message: "Only receivers can send this request",
      });
    }

    await prisma.receiverRequest.create({
      data: {
        requestType: "availability_request",
        receiverId,
        targetUserId: null,
        targetType: "admin",
        bloodGroup,
        city: receiver.city || "",
        quantity,
        status: "pending",
      },
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
    });
  }
};

const getSentTargetsController = async (req, res) => {
  try {
    const requests = await prisma.receiverRequest.findMany({
      where: {
        receiverId: req.body.userId,
        requestType: "blood_request",
        targetUserId: { not: null },
      },
      select: { targetUserId: true },
    });

    return res.status(200).send({
      success: true,
      targetUserIds: requests.map((item) => String(item.targetUserId)),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error fetching sent request targets",
    });
  }
};

const getIncomingRequestsController = async (req, res) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.body.userId },
      select: { role: true },
    });
    if (!currentUser || !["donor", "organization"].includes(currentUser.role)) {
      return res.status(403).send({
        success: false,
        message: "Only donor or organization can view incoming requests",
      });
    }

    const requests = await prisma.receiverRequest.findMany({
      where: {
        requestType: "blood_request",
        targetUserId: req.body.userId,
      },
      include: {
        receiver: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).send({
      success: true,
      message: "Incoming blood requests fetched successfully",
      requests: requests.map(mapReceiverRequest),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error fetching incoming blood requests",
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

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser || !["donor", "organization"].includes(currentUser.role)) {
      return res.status(403).send({
        success: false,
        message: "Only donor or organization can update request status",
      });
    }

    const request = await prisma.receiverRequest.findFirst({
      where: {
        id: requestId,
        requestType: "blood_request",
        targetUserId: userId,
      },
      include: {
        receiver: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

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

    if (action === "accept") {
      const requestedQuantity = Number(request.quantity);
      if (!requestedQuantity || requestedQuantity <= 0) {
        return res.status(400).send({
          success: false,
          message: "Invalid request quantity",
        });
      }

      if (request.targetType === "organization") {
        const available = await getOrganizationAvailableQuantity({
          organizationId: currentUser.id,
          bloodGroup: request.bloodGroup,
        });

        if (available < requestedQuantity) {
          return res.status(400).send({
            success: false,
            message: `Only ${available}ML of ${request.bloodGroup} is available.`,
          });
        }

        await prisma.inventory.create({
          data: {
            inventoryType: "out",
            bloodGroup: request.bloodGroup,
            quantity: requestedQuantity,
            email: request.receiver?.email || "",
            organizationId: currentUser.id,
            hospitalId: request.receiverId,
          },
        });
      } else if (request.targetType === "donor") {
        const available = await getDonorAvailableQuantity({
          donorId: currentUser.id,
          bloodGroup: request.bloodGroup,
        });

        if (available < requestedQuantity) {
          return res.status(400).send({
            success: false,
            message: `Only ${available}ML of ${request.bloodGroup} is available.`,
          });
        }

        const organizationId = await findDonorOrganizationForOut({
          donorId: currentUser.id,
          bloodGroup: request.bloodGroup,
        });

        if (!organizationId) {
          return res.status(400).send({
            success: false,
            message: "Unable to locate donor stock for this blood group",
          });
        }

        await prisma.inventory.create({
          data: {
            inventoryType: "out",
            bloodGroup: request.bloodGroup,
            quantity: requestedQuantity,
            email: request.receiver?.email || "",
            organizationId,
            hospitalId: request.receiverId,
            donorId: currentUser.id,
          },
        });
      }
    }

    const updatedRequest = await prisma.receiverRequest.update({
      where: { id: request.id },
      data: {
        status: action === "accept" ? "accepted" : "rejected",
      },
      include: {
        receiver: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    await sendRequestStatusEmailToReceiver({
      receiver: request.receiver,
      targetUser: currentUser,
      status: updatedRequest.status,
      bloodGroup: request.bloodGroup,
      quantity: request.quantity,
      city: request.city,
    });

    return res.status(200).send({
      success: true,
      message:
        updatedRequest.status === "accepted"
          ? "Request accepted successfully"
          : "Request rejected successfully",
      request: mapReceiverRequest(updatedRequest),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error updating request status",
    });
  }
};

const getReceiverRequestsController = async (req, res) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.body.userId },
      select: { role: true },
    });
    if (!currentUser || currentUser.role !== "receiver") {
      return res.status(403).send({
        success: false,
        message: "Only receivers can view their requests",
      });
    }

    const status = String(req.query.status || "all").toLowerCase();
    const allowed = new Set(["all", "pending", "accepted", "rejected", "approved"]);
    if (!allowed.has(status)) {
      return res.status(400).send({
        success: false,
        message: "Invalid status filter",
      });
    }

    const where = {
      receiverId: req.body.userId,
      requestType: "blood_request",
    };
    if (status !== "all") {
      where.status = status;
    }

    const requests = await prisma.receiverRequest.findMany({
      where,
      include: {
        targetUser: {
          select: {
            id: true,
            name: true,
            organizationName: true,
            email: true,
            phone: true,
            role: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).send({
      success: true,
      requests: requests.map(mapReceiverRequest),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error fetching receiver requests",
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
  getReceiverRequestsController,
};
