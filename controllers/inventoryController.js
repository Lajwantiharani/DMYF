const mongoose = require("mongoose");
const InventoryModel = require("../models/InventoryModel");
const userModel = require("../models/userModel");

const createInventoryController = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the user exists
    const user = await userModel.findOne({ email });

    if (!user) {
      throw new Error("User not found");
    }

    if (req.body.inventoryType === "out") {
      const requestedBloodGroup = req.body.bloodGroup;
      const requestedQuantityOfBloodGroup = req.body.quantity;
      const organization = new mongoose.Types.ObjectId(req.body.userId);

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

      req.body.hospital = user?._id;
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

module.exports = {
  createInventoryController,
  getInventoryController,
  getDonorsController,
};
