const InventoryModel = require("../models/InventoryModel");
const userModel = require("../models/userModel");

const createInventoryController = async (req, res) => {
  try {
    const { email, inventoryType } = req.body;

    // Check if the user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    // Check if the user role is valid for the inventory type
    if (inventoryType === "in" && user.role !== "donor") {
      throw new Error("Not a donor account");
    }
    if (inventoryType === "out" && user.role !== "hospital") {
      throw new Error("Not a hospital account");
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
      error // Send the error message for debugging
    });
  }
};

module.exports = { createInventoryController };
