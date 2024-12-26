const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createInventoryController,
  getInventoryController,
  getDonorsController,
  getHospitalController,
  getOrgnaizationController,
  getOrgnaisationForHospitalController,
  getInventoryHospitalController,
  getRecentInventoryController,
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
//get hospital  BLOOD DONORS

router.post(
  "/get-inventory-hospital",
  authMiddleware,
  getInventoryHospitalController
);
//get donor records
router.get("/get-donors", authMiddleware, getDonorsController);
//get hospital  records
router.get("/get-hospitals", authMiddleware, getHospitalController);
//get organization  records
router.get("/get-organization", authMiddleware, getOrgnaizationController);

//get organization  records
router.get(
  "/get-organization-for-hospital",
  authMiddleware,
  getOrgnaisationForHospitalController
);
module.exports = router;
