const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  bloodGroupDetailsContoller,
  analyticsDashboardController,
} = require("../controllers/analyticsController");

const router = express.Router();

//routes

//GET BLOOD DATA
router.get("/bloodGroups-data", authMiddleware, bloodGroupDetailsContoller);
router.get("/dashboard-data", authMiddleware, analyticsDashboardController);

module.exports = router;
