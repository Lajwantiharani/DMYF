const mongoose = require("mongoose");
const InventoryModel = require("../models/InventoryModel");
const userModel = require("../models/userModel");

const getRoleScope = async (userId) => {
  const user = await userModel.findById(userId).select("role");
  if (!user) return null;

  if (user.role === "admin") return {};
  if (user.role === "organization") return { organization: new mongoose.Types.ObjectId(userId) };
  if (user.role === "donor") return { donor: new mongoose.Types.ObjectId(userId) };
  if (user.role === "hospital" || user.role === "receiver") {
    return { hospital: new mongoose.Types.ObjectId(userId) };
  }

  return { organization: new mongoose.Types.ObjectId(userId) };
};
//GET BLOOD DATA
const bloodGroupDetailsContoller = async (req, res) => {
  try {
    const bloodGroups = ["O+", "O-", "AB+", "AB-", "A+", "A-", "B+", "B-"];
    const scope = await getRoleScope(req.body.userId);

    if (scope === null) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    const aggregated = await InventoryModel.aggregate([
      { $match: scope },
      {
        $group: {
          _id: "$bloodGroup",
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
    ]);

    const map = new Map(
      aggregated.map((x) => [
        x._id,
        {
          totalIn: x.totalIn || 0,
          totalOut: x.totalOut || 0,
        },
      ]),
    );

    const bloodGroupData = bloodGroups.map((bloodGroup) => {
      const item = map.get(bloodGroup) || { totalIn: 0, totalOut: 0 };
      return {
        bloodGroup,
        totalIn: item.totalIn,
        totalOut: item.totalOut,
        availabeBlood: Math.max(item.totalIn - item.totalOut, 0),
      };
    });

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
      error,
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

    const bloodGroups = ["O+", "O-", "AB+", "AB-", "A+", "A-", "B+", "B-"];

    const grouped = await InventoryModel.aggregate([
      { $match: scope },
      {
        $group: {
          _id: "$bloodGroup",
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
    ]);

    const groupedMap = new Map(
      grouped.map((x) => [
        x._id,
        {
          totalIn: x.totalIn || 0,
          totalOut: x.totalOut || 0,
        },
      ]),
    );

    const bloodGroupData = bloodGroups.map((bloodGroup) => {
      const item = groupedMap.get(bloodGroup) || { totalIn: 0, totalOut: 0 };
      return {
        bloodGroup,
        totalIn: item.totalIn,
        totalOut: item.totalOut,
        availabeBlood: Math.max(item.totalIn - item.totalOut, 0),
      };
    });

    const totals = bloodGroupData.reduce(
      (acc, item) => {
        acc.totalIn += item.totalIn;
        acc.totalOut += item.totalOut;
        acc.available += item.availabeBlood;
        return acc;
      },
      { totalIn: 0, totalOut: 0, available: 0 },
    );

    const recentTransactions = await InventoryModel.find(scope)
      .sort({ createdAt: -1 })
      .limit(8)
      .select("bloodGroup inventoryType quantity email createdAt");

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
      error,
    });
  }
};

module.exports = { bloodGroupDetailsContoller, analyticsDashboardController };
