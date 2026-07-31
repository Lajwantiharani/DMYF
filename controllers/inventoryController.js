const prisma = require("../config/prisma");
const { mapUserPublic, mapInventory } = require("../utils/serialize");
const {
  isValidBloodGroup,
  normalizeBloodGroup,
  isValidEmail,
} = require("../utils/validation");

const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  organizationName: true,
  email: true,
  phone: true,
  role: true,
  city: true,
  address: true,
  bloodGroup: true,
  nukh: true,
  akaah: true,
  website: true,
  dob: true,
  profileVerificationStatus: true,
  isVerified: true,
  createdAt: true,
};

const USER_DONATED_SELECT = {
  id: true,
  name: true,
  organizationName: true,
  email: true,
  role: true,
};

const getAvailableQuantity = async (organizationId, bloodGroup) => {
  const [inResult, outResult] = await Promise.all([
    prisma.inventory.aggregate({
      where: {
        organizationId,
        inventoryType: "in",
        bloodGroup,
      },
      _sum: { quantity: true },
    }),
    prisma.inventory.aggregate({
      where: {
        organizationId,
        inventoryType: "out",
        bloodGroup,
      },
      _sum: { quantity: true },
    }),
  ]);

  const totalIn = inResult._sum.quantity || 0;
  const totalOut = outResult._sum.quantity || 0;
  return totalIn - totalOut;
};

const createInventoryController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).send({ success: false, message: "Valid email is required" });
    }

    const requestedBloodGroup = req.body.bloodGroup;
    if (!isValidBloodGroup(requestedBloodGroup)) {
      return res.status(400).send({ success: false, message: "Invalid blood group" });
    }

    const requestedQuantity = Number(req.body.quantity);
    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      return res.status(400).send({ success: false, message: "Quantity must be a positive number" });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.body.userId },
    });

    if (!currentUser) {
      return res.status(404).send({ success: false, message: "Current user not found" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    let organizationId = req.body.organization || req.body.userId;
    let hospitalId = req.body.hospital || null;
    let donorId = req.body.donor || null;
    let inventoryType = req.body.inventoryType;

    if (currentUser.role === "receiver") {
      if (user.role !== "donor" && user.role !== "organization") {
        return res.status(400).send({
          success: false,
          message: "Receiver can receive blood only from donor or organization email",
        });
      }

      inventoryType = "out";
      hospitalId = currentUser.id;

      if (user.role === "donor") {
        const latestDonation = await prisma.inventory.findFirst({
          where: {
            donorId: user.id,
            inventoryType: "in",
            bloodGroup: req.body.bloodGroup,
          },
          orderBy: { createdAt: "desc" },
        });

        if (!latestDonation) {
          return res.status(400).send({
            success: false,
            message: "No donor stock found for selected blood group",
          });
        }

        organizationId = latestDonation.organizationId;
      } else if (user.role === "organization") {
        organizationId = user.id;
      }
    } else if (currentUser.role === "organization") {
      if (organizationId && organizationId !== currentUser.id) {
        return res.status(403).send({
          success: false,
          message: "Not authorized to create inventory for another organization",
        });
      }
      organizationId = currentUser.id;
    } else if (currentUser.role === "donor") {
      if (donorId && donorId !== currentUser.id) {
        return res.status(403).send({
          success: false,
          message: "Not authorized to create inventory for another donor",
        });
      }
      donorId = currentUser.id;
    }

    const effectiveInventoryType =
      inventoryType === "in" && user.role === "receiver" ? "out" : inventoryType;

    inventoryType = effectiveInventoryType;

    if (effectiveInventoryType === "out") {
      const requestedBloodGroup = req.body.bloodGroup;
      const orgId = organizationId || req.body.userId;

      const availableQuantityOfBloodGroup = await getAvailableQuantity(
        orgId,
        requestedBloodGroup,
      );

      if (availableQuantityOfBloodGroup < requestedQuantity) {
        return res.status(400).send({
          success: false,
          message: `Only ${availableQuantityOfBloodGroup}ML of ${requestedBloodGroup.toUpperCase()} is available.`,
        });
      }

      if (!hospitalId) {
        hospitalId = user.id;
      }
    } else {
      donorId = user.id;
    }

    await prisma.inventory.create({
      data: {
        inventoryType,
        bloodGroup: normalizeBloodGroup(req.body.bloodGroup),
        quantity: requestedQuantity,
        email: req.body.email || email,
        organizationId,
        hospitalId,
        donorId,
      },
    });

    return res.status(201).send({
      success: true,
      message: "New blood record added",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in create inventory API",
    });
  }
};

const getInventoryController = async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      where: { organizationId: req.body.userId },
      include: {
        donor: { select: USER_PUBLIC_SELECT },
        hospital: { select: USER_PUBLIC_SELECT },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).send({
      success: true,
      message: "Get all records successfully",
      inventory: inventory.map(mapInventory),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in get all inventory",
    });
  }
};

const getInventoryHospitalController = async (req, res) => {
  try {
    const userId = req.body.userId;
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!currentUser) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    let where = {};
    if (currentUser.role === "receiver") {
      where = { hospitalId: userId };
    } else if (currentUser.role === "organization") {
      where = { organizationId: userId };
    } else if (currentUser.role === "donor") {
      where = { donorId: userId };
    } else if (currentUser.role === "admin") {
      where = {};
    } else {
      return res.status(403).send({
        success: false,
        message: "Not allowed to view inventory",
      });
    }

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        donor: { select: USER_PUBLIC_SELECT },
        hospital: { select: USER_PUBLIC_SELECT },
        organization: { select: USER_PUBLIC_SELECT },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).send({
      success: true,
      message: "Get receiver consumer records successfully",
      inventory: inventory.map(mapInventory),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in get consumer  inventory",
    });
  }
};

const getDonorsController = async (req, res) => {
  try {
    const organizationId = req.body.userId;

    const donorRecords = await prisma.inventory.findMany({
      where: { organizationId },
      distinct: ["donorId"],
      select: { donorId: true },
    });

    const donorIds = donorRecords
      .map((record) => record.donorId)
      .filter(Boolean);

    const donors = await prisma.user.findMany({
      where: { id: { in: donorIds } },
      select: USER_PUBLIC_SELECT,
    });

    return res.status(200).send({
      success: true,
      message: "Get donors successfully",
      donors: donors.map(mapUserPublic),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in get donors irecords ",
    });
  }
};

const getRecentInventoryController = async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      where: { organizationId: req.body.userId },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).send({
      success: true,
      message: "recent Invenotry Data",
      inventory: inventory.map(mapInventory),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Recent Inventory API",
    });
  }
};

const getOrgnaizationController = async (req, res) => {
  try {
    const donorId = req.body.userId;

    const orgRecords = await prisma.inventory.findMany({
      where: { donorId },
      distinct: ["organizationId"],
      select: { organizationId: true },
    });

    const orgIds = orgRecords.map((record) => record.organizationId);

    const organizations = await prisma.user.findMany({
      where: { id: { in: orgIds } },
      select: USER_PUBLIC_SELECT,
    });

    return res.status(200).send({
      success: true,
      message: "Org Data Fetched Successfully",
      organizations: organizations.map(mapUserPublic),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In ORG API",
    });
  }
};

const getDonatedRecordsController = async (req, res) => {
  try {
    const userId = req.body.userId;
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    const where = { inventoryType: "out" };

    if (currentUser.role === "organization") {
      where.organizationId = userId;

      const receivers = await prisma.user.findMany({
        where: { role: "receiver" },
        select: { id: true },
      });

      where.hospitalId = { in: receivers.map((receiver) => receiver.id) };
    } else if (currentUser.role === "donor") {
      const orgRecords = await prisma.inventory.findMany({
        where: {
          donorId: userId,
          inventoryType: "in",
        },
        distinct: ["organizationId"],
        select: { organizationId: true },
      });

      const orgIds = orgRecords.map((record) => record.organizationId);

      if (!orgIds.length) {
        return res.status(200).send({
          success: true,
          message: "Donated records fetched successfully",
          donated: [],
        });
      }

      where.organizationId = { in: orgIds };
    } else if (currentUser.role === "receiver") {
      where.hospitalId = userId;
    }

    const donated = await prisma.inventory.findMany({
      where,
      include: {
        hospital: { select: USER_DONATED_SELECT },
        organization: { select: USER_DONATED_SELECT },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).send({
      success: true,
      message: "Donated records fetched successfully",
      donated: donated.map(mapInventory),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in donated records API",
    });
  }
};

const getOrganizationAvailableStockController = async (req, res) => {
  try {
    const [inGroups, outGroups] = await Promise.all([
      prisma.inventory.groupBy({
        by: ["organizationId", "bloodGroup"],
        where: { inventoryType: "in" },
        _sum: { quantity: true },
        _max: { createdAt: true },
      }),
      prisma.inventory.groupBy({
        by: ["organizationId", "bloodGroup"],
        where: { inventoryType: "out" },
        _sum: { quantity: true },
        _max: { createdAt: true },
      }),
    ]);

    const stockMap = new Map();

    for (const row of inGroups) {
      const key = `${row.organizationId}:${row.bloodGroup}`;
      stockMap.set(key, {
        organization: row.organizationId,
        bloodGroup: row.bloodGroup,
        totalIn: row._sum.quantity || 0,
        totalOut: 0,
        lastUpdated: row._max.createdAt,
      });
    }

    for (const row of outGroups) {
      const key = `${row.organizationId}:${row.bloodGroup}`;
      const existing = stockMap.get(key) || {
        organization: row.organizationId,
        bloodGroup: row.bloodGroup,
        totalIn: 0,
        totalOut: 0,
        lastUpdated: null,
      };

      existing.totalOut = row._sum.quantity || 0;

      if (
        row._max.createdAt &&
        (!existing.lastUpdated || row._max.createdAt > existing.lastUpdated)
      ) {
        existing.lastUpdated = row._max.createdAt;
      }

      stockMap.set(key, existing);
    }

    const availableStock = Array.from(stockMap.values())
      .map((entry) => ({
        organization: entry.organization,
        bloodGroup: entry.bloodGroup,
        availableQuantity: entry.totalIn - entry.totalOut,
        lastUpdated: entry.lastUpdated,
      }))
      .filter((entry) => entry.availableQuantity > 0);

    const orgIds = [...new Set(availableStock.map((entry) => entry.organization))];

    const organizations = await prisma.user.findMany({
      where: { id: { in: orgIds } },
      select: {
        id: true,
        organizationName: true,
        email: true,
        phone: true,
      },
    });

    const orgMap = new Map(organizations.map((org) => [org.id, org]));

    const stock = availableStock
      .map((entry) => {
        const org = orgMap.get(entry.organization);
        return {
          organization: entry.organization,
          bloodGroup: entry.bloodGroup,
          availableQuantity: entry.availableQuantity,
          lastUpdated: entry.lastUpdated,
          organizationName: org?.organizationName,
          email: org?.email,
          phone: org?.phone,
        };
      })
      .sort((a, b) => {
        const nameCompare = (a.organizationName || "").localeCompare(
          b.organizationName || "",
        );
        if (nameCompare !== 0) return nameCompare;
        return a.bloodGroup.localeCompare(b.bloodGroup);
      });

    return res.status(200).send({
      success: true,
      message: "Organization available stock fetched successfully",
      stock,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in organization stock API",
    });
  }
};

const getOrganizationReceiverSummaryController = async (req, res) => {
  try {
    const organizationId = req.body.userId;

    const summaryGroups = await prisma.inventory.groupBy({
      by: ["hospitalId"],
      where: {
        organizationId,
        inventoryType: "out",
        hospitalId: { not: null },
      },
      _sum: { quantity: true },
      _max: { createdAt: true },
    });

    const hospitalIds = summaryGroups
      .map((group) => group.hospitalId)
      .filter(Boolean);

    const receivers = await prisma.user.findMany({
      where: { id: { in: hospitalIds } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    const receiverMap = new Map(receivers.map((receiver) => [receiver.id, receiver]));

    const summary = summaryGroups
      .map((group) => {
        const receiver = receiverMap.get(group.hospitalId);
        if (!receiver) return null;

        return {
          receiverId: receiver.id,
          name: receiver.name,
          email: receiver.email,
          phone: receiver.phone,
          totalDonatedML: group._sum.quantity || 0,
          lastDonatedAt: group._max.createdAt,
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) => new Date(b.lastDonatedAt) - new Date(a.lastDonatedAt),
      );

    return res.status(200).send({
      success: true,
      message: "Organization receiver summary fetched successfully",
      receiverSummary: summary,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in organization receiver summary API",
    });
  }
};

module.exports = {
  createInventoryController,
  getInventoryController,
  getDonorsController,
  getOrgnaizationController,
  getInventoryHospitalController,
  getRecentInventoryController,
  getDonatedRecordsController,
  getOrganizationAvailableStockController,
  getOrganizationReceiverSummaryController,
};
