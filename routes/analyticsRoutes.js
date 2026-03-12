const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  bloodGroupDetailsContoller,
  analyticsDashboardController,

  analyticsTransactionsController,
} = require("../controllers/analyticsController");

const router = express.Router();

//routes

//GET BLOOD DATA
router.get("/bloodGroups-data", authMiddleware, bloodGroupDetailsContoller);
router.get("/dashboard-data", authMiddleware, analyticsDashboardController);

router.get("/transactions", authMiddleware, analyticsTransactionsController);

module.exports = router;
