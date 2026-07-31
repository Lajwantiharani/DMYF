const prisma = require("../config/prisma");
const { withMongoStyleId } = require("../utils/serialize");

const BLOOD_GROUPS = ["O+", "O-", "AB+", "AB-", "A+", "A-", "B+", "B-"];

const TRANSACTION_SELECT = {
  id: true,
  bloodGroup: true,
  inventoryType: true,
  quantity: true,
  email: true,
  createdAt: true,
};

const mapTransactionItem = (item) => withMongoStyleId(item);

const getRoleScope = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return null;

  if (user.role === "admin") return {};
  if (user.role === "organization") return { organizationId: userId };
  if (user.role === "donor") return { donorId: userId };
  if (user.role === "receiver") return { hospitalId: userId };

  return { organizationId: userId };
};

const fetchBloodGroupData = async (scope) => {
  const [inGroups, outGroups] = await Promise.all([
    prisma.inventory.groupBy({
      by: ["bloodGroup"],
      where: { ...scope, inventoryType: "in" },
      _sum: { quantity: true },
    }),
    prisma.inventory.groupBy({
      by: ["bloodGroup"],
      where: { ...scope, inventoryType: "out" },
      _sum: { quantity: true },
    }),
  ]);

  const inMap = new Map(
    inGroups.map((x) => [x.bloodGroup, x._sum.quantity || 0]),
  );
  const outMap = new Map(
    outGroups.map((x) => [x.bloodGroup, x._sum.quantity || 0]),
  );

  return BLOOD_GROUPS.map((bloodGroup) => {
    const totalIn = inMap.get(bloodGroup) || 0;
    const totalOut = outMap.get(bloodGroup) || 0;
    return {
      bloodGroup,
      totalIn,
      totalOut,
      availabeBlood: Math.max(totalIn - totalOut, 0),
    };
  });
};

//GET BLOOD DATA
const bloodGroupDetailsContoller = async (req, res) => {
  try {
    const scope = await getRoleScope(req.body.userId);

    if (scope === null) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    const bloodGroupData = await fetchBloodGroupData(scope);

    return res.status(200).send({
      success: true,
      message: "Blood Group Data Fetch Successfully",
      bloodGroupData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Bloodgroup Data Analytics API",
    });
  }
};

const analyticsDashboardController = async (req, res) => {
  try {
    const scope = await getRoleScope(req.body.userId);

    if (scope === null) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    const bloodGroupData = await fetchBloodGroupData(scope);

    const totals = bloodGroupData.reduce(
      (acc, item) => {
        acc.totalIn += item.totalIn;
        acc.totalOut += item.totalOut;
        acc.available += item.availabeBlood;
        return acc;
      },
      { totalIn: 0, totalOut: 0, available: 0 },
    );

    const recentRows = await prisma.inventory.findMany({
      where: scope,
      orderBy: { createdAt: "desc" },
      take: 8,
      select: TRANSACTION_SELECT,
    });

    const recentTransactions = recentRows.map(mapTransactionItem);

    return res.status(200).send({
      success: true,
      message: "Analytics dashboard fetched successfully",
      bloodGroupData,
      totals,
      recentTransactions,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in analytics dashboard API",
    });
  }
};

const analyticsTransactionsController = async (req, res) => {
  try {
    const scope = await getRoleScope(req.body.userId);

    if (scope === null) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const sortDir = (req.query.sort || "desc").toLowerCase() === "asc" ? "asc" : "desc";

    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    if (startDate && Number.isNaN(startDate.getTime())) {
      return res.status(400).send({ success: false, message: "Invalid startDate" });
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      return res.status(400).send({ success: false, message: "Invalid endDate" });
    }

    const where = { ...scope };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) {
        const inclusiveEnd = new Date(endDate);
        inclusiveEnd.setHours(23, 59, 59, 999);
        where.createdAt.lte = inclusiveEnd;
      }
    }

    const total = await prisma.inventory.count({ where });
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const rows = await prisma.inventory.findMany({
      where,
      orderBy: { createdAt: sortDir },
      skip,
      take: limit,
      select: TRANSACTION_SELECT,
    });

    const items = rows.map(mapTransactionItem);

    return res.status(200).send({
      success: true,
      message: "Transactions fetched successfully",
      page: safePage,
      limit,
      total,
      totalPages,
      items,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in transactions API",
    });
  }
};

module.exports = {
  bloodGroupDetailsContoller,
  analyticsDashboardController,
  analyticsTransactionsController,
};
