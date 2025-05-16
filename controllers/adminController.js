const userModel = require("../models/userModel");

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
//EXPORT
module.exports = {
  getDonorsListController,
  getHospitalListController,
  getOrgListController,
  deleteDonorController,
  getReceiverListController,
  addReceiverController,
};
