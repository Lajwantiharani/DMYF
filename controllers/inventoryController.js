const mongoose = require("mongoose");
const InventoryModel = require("../models/InventoryModel");
const userModel = require("../models/userModel");

const createInventoryController = async (req, res) => {
  try {
    const { email } = req.body;
    const currentUser = await userModel.findById(req.body.userId);

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    // Counter-party user (donor/receiver/hospital) identified by email
    const user = await userModel.findOne({ email });

    if (!user) {
      throw new Error("User not found");
    }

    // Receiver flow: receiver takes blood from donor or organization
    if (currentUser.role === "receiver") {
      if (user.role !== "donor" && user.role !== "organization") {
        return res.status(400).send({
          success: false,
          message: "Receiver can receive blood only from donor or organization email",
        });
      }

      // Force OUT for receiver-side receive and attach proper refs
      req.body.inventoryType = "out";
      req.body.hospital = currentUser._id;

      if (user.role === "donor") {
        const latestDonation = await InventoryModel.findOne({
          donor: user._id,
          inventoryType: "in",
          bloodGroup: req.body.bloodGroup,
        }).sort({ createdAt: -1 });

        if (!latestDonation) {
          return res.status(400).send({
            success: false,
            message: "No donor stock found for selected blood group",
          });
        }

        req.body.organization = latestDonation.organization;
      } else if (user.role === "organization") {
        req.body.organization = user._id;
      }
    }

    // Auto-convert to OUT when blood is issued to a receiver account.
    // This ensures receiver-side receiving always deducts stock.
    const effectiveInventoryType =
      req.body.inventoryType === "in" && user.role === "receiver"
        ? "out"
        : req.body.inventoryType;

    req.body.inventoryType = effectiveInventoryType;

    if (effectiveInventoryType === "out") {
      const requestedBloodGroup = req.body.bloodGroup;
      const requestedQuantityOfBloodGroup = req.body.quantity;
      const organization = new mongoose.Types.ObjectId(
        req.body.organization || req.body.userId,
      );

      // Calculate the total "in" quantity of the requested blood group
      const totalInOfRequestedBloodGroup = await InventoryModel.aggregate([
        {
          $match: {
            organization,
            inventoryType: "in",
            bloodGroup: requestedBloodGroup,
          },
        },
        {
          $group: {
            _id: "$bloodGroup",
            totalIn: { $sum: "$quantity" },
          },
        },
      ]);

      const totalIn = totalInOfRequestedBloodGroup[0]?.totalIn || 0;

      // Calculate the total "out" quantity of the requested blood group
      const totalOutOfRequestedBloodGroup = await InventoryModel.aggregate([
        {
          $match: {
            organization,
            inventoryType: "out",
            bloodGroup: requestedBloodGroup,
          },
        },
        {
          $group: {
            _id: "$bloodGroup",
            totalOut: { $sum: "$quantity" },
          },
        },
      ]);

      const totalOut = totalOutOfRequestedBloodGroup[0]?.totalOut || 0;

      const availableQuantityOfBloodGroup = totalIn - totalOut;

      // Validate the requested quantity
      if (availableQuantityOfBloodGroup < requestedQuantityOfBloodGroup) {
        return res.status(500).send({
          success: false,
          message: `Only ${availableQuantityOfBloodGroup}ML of ${requestedBloodGroup.toUpperCase()} is available.`,
        });
      }

      if (!req.body.hospital) {
        req.body.hospital = user?._id;
      }
    } else {
      req.body.donor = user?._id;
    }

    // Save the inventory record
    const inventory = new InventoryModel(req.body);
    await inventory.save();

    return res.status(201).send({
      success: true,
      message: "New blood record added",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in create inventory API",
      error,
    });
  }
};

// Get all blood records
const getInventoryController = async (req, res) => {
  try {
    const inventory = await InventoryModel.find({
      organization: req.body.userId,
    })
      .populate("donor")
      .populate("hospital")
      .sort({ createdAt: -1 });

    return res.status(200).send({
      success: true,
      message: "Get all records successfully",
      inventory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in get all inventory",
      error,
    });
  }
};
//get hospital blood records
const getInventoryHospitalController = async (req, res) => {
  try {
    const inventory = await InventoryModel.find(req.body.filters)
      .populate("donor")
      .populate("hospital")
      .populate("organization")
      .sort({ createdAt: -1 });

    return res.status(200).send({
      success: true,
      message: "Get hospital consumer  records successfully",
      inventory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in get consumer  inventory",
      error,
    });
  }
};

//GET DONOR RECORD
const getDonorsController = async (req, res) => {
  try {
    const organization = req.body.userId;
    //find donor
    const donorId = await InventoryModel.distinct("donor", { organization });
    //console.log(donorId);
    const donors = await userModel.find({ _id: { $in: donorId } });
    return res.status(200).send({
      success: true,
      message: "Get donors successfully",
      donors,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in get donors irecords ",
      error,
    });
  }
};

const getHospitalController = async (req, res) => {
  try {
    const organization = req.body.userId;
    //GET HOSPITAL ID
    const hospitalId = await InventoryModel.distinct("hospital", {
      organization,
    });
    //FIND HOSPITAL
    const hospitals = await userModel.find({
      _id: { $in: hospitalId },
    });
    return res.status(200).send({
      success: true,
      message: "Hospitals Data Fetched Successfully",
      hospitals,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In get Hospital API",
      error,
    });
  }
};
const getRecentInventoryController = async (req, res) => {
  try {
    const inventory = await InventoryModel
      .find({
        organization: req.body.userId,
      })
      .limit(3)
      .sort({ createdAt: -1 });
    return res.status(200).send({
      success: true,
      message: "recent Invenotry Data",
      inventory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Recent Inventory API",
      error,
    });
  }
};
const getOrgnaizationController = async (req, res) => {
  try {
    const donor = req.body.userId;
    const orgId = await InventoryModel.distinct("organization", { donor });
    //find org
    const organizations = await userModel.find({
      _id: { $in: orgId },
    });
    return res.status(200).send({
      success: true,
      message: "Org Data Fetched Successfully",
      organizations,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In ORG API",
      error,
    });
  }
};
// GET ORG for Hospital
const getOrgnaisationForHospitalController = async (req, res) => {
  try {
    const hospital = req.body.userId;
    const orgId = await InventoryModel.distinct("organization", { hospital });
    //find org
    const organizations = await userModel.find({
      _id: { $in: orgId },
    });
    return res.status(200).send({
      success: true,
      message: "Hospital Org Data Fetched Successfully",
      organizations,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Hospital ORG API",
      error,
    });
  }
};

const getDonatedRecordsController = async (req, res) => {
  try {
    const userId = req.body.userId;
    const currentUser = await userModel.findById(userId);

    if (!currentUser) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    const query = { inventoryType: "out" };

    if (currentUser.role === "organization") {
      query.organization = userId;
      const receiverIds = await userModel.distinct("_id", { role: "receiver" });
      query.hospital = { $in: receiverIds };
    } else if (currentUser.role === "donor") {
      const orgIds = await InventoryModel.distinct("organization", {
        donor: userId,
        inventoryType: "in",
      });

      if (!orgIds.length) {
        return res.status(200).send({
          success: true,
          message: "Donated records fetched successfully",
          donated: [],
        });
      }

      query.organization = { $in: orgIds };
    } else if (currentUser.role === "hospital" || currentUser.role === "receiver") {
      query.hospital = userId;
    }
    // admin: no extra filter, can see all out records

    const donated = await InventoryModel.find(query)
      .populate("hospital", "name hospitalName organizationName email role")
      .populate("organization", "name organizationName hospitalName email role")
      .sort({ createdAt: -1 });

    return res.status(200).send({
      success: true,
      message: "Donated records fetched successfully",
      donated,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in donated records API",
      error,
    });
  }
};

const getOrganizationAvailableStockController = async (req, res) => {
  try {
    const stock = await InventoryModel.aggregate([
      {
        $match: {
          inventoryType: { $in: ["in", "out"] },
        },
      },
      {
        $group: {
          _id: {
            organization: "$organization",
            bloodGroup: "$bloodGroup",
          },
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
          lastUpdated: { $max: "$createdAt" },
        },
      },
      {
        $project: {
          _id: 0,
          organization: "$_id.organization",
          bloodGroup: "$_id.bloodGroup",
          availableQuantity: { $subtract: ["$totalIn", "$totalOut"] },
          lastUpdated: 1,
        },
      },
      {
        $match: {
          availableQuantity: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "organization",
          foreignField: "_id",
          as: "organizationInfo",
        },
      },
      {
        $unwind: "$organizationInfo",
      },
      {
        $project: {
          organization: 1,
          bloodGroup: 1,
          availableQuantity: 1,
          lastUpdated: 1,
          organizationName: "$organizationInfo.organizationName",
          email: "$organizationInfo.email",
          phone: "$organizationInfo.phone",
        },
      },
      { $sort: { organizationName: 1, bloodGroup: 1 } },
    ]);

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
      error,
    });
  }
};

const getOrganizationReceiverSummaryController = async (req, res) => {
  try {
    const organization = new mongoose.Types.ObjectId(req.body.userId);

    const summary = await InventoryModel.aggregate([
      {
        $match: {
          organization,
          inventoryType: "out",
          hospital: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$hospital",
          totalDonatedML: { $sum: "$quantity" },
          lastDonatedAt: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "receiverInfo",
        },
      },
      { $unwind: "$receiverInfo" },
      {
        $project: {
          _id: 0,
          receiverId: "$receiverInfo._id",
          name: "$receiverInfo.name",
          email: "$receiverInfo.email",
          phone: "$receiverInfo.phone",
          totalDonatedML: 1,
          lastDonatedAt: 1,
        },
      },
      { $sort: { lastDonatedAt: -1 } },
    ]);

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
      error,
    });
  }
};

module.exports = {
  createInventoryController,
  getInventoryController,
  getDonorsController,
  getHospitalController,
  getOrgnaizationController,
  getOrgnaisationForHospitalController,
  getInventoryHospitalController,
  getRecentInventoryController,
  getDonatedRecordsController,
  getOrganizationAvailableStockController,
  getOrganizationReceiverSummaryController,
};
