const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createInventoryController,
  getInventoryController,
  getDonorsController,
  getOrgnaizationController,
  getInventoryHospitalController,
  getRecentInventoryController,
  getDonatedRecordsController,
  getOrganizationAvailableStockController,
  getOrganizationReceiverSummaryController,
} = require("../controllers/inventoryController");

const router = express.Router();

//routes
//add inventory || POST
router.post("/create-inventory", authMiddleware, createInventoryController);

//get ALL BLOOD DONORS

router.get("/get-inventory", authMiddleware, getInventoryController);
//get recent  BLOOD DONORS

router.get(
  "/get-recent-inventory",
  authMiddleware,
  getRecentInventoryController
);
// get receiver blood records

router.post(
  "/get-inventory-hospital",
  authMiddleware,
  getInventoryHospitalController
);
//get donor records
router.get("/get-donors", authMiddleware, getDonorsController);
//get organization  records
router.get("/get-organization", authMiddleware, getOrgnaizationController);

router.get("/get-donated-records", authMiddleware, getDonatedRecordsController);
router.get(
  "/get-organization-available-stock",
  authMiddleware,
  getOrganizationAvailableStockController
);
router.get(
  "/get-organization-receiver-summary",
  authMiddleware,
  getOrganizationReceiverSummaryController
);
module.exports = router;
