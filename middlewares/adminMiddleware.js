const userModel = require("../models/userModel");

module.exports = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.body.userId);

    // Check if the user is an admin
    if (user?.role !== "admin") {
      return res.status(401).send({
        success: false,
        message: "Auth failed: Admin access required",
      });
    } else {
      next(); // Pass control to the next middleware or route handler
    }
  } catch (error) {
    console.error(error);
    return res.status(401).send({
      success: false,
      message: "Auth failed: Admin API",
      error,
    });
  }
};
