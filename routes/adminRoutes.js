const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { getDonorsListController, getHospitalListController, getOrgListController, deleteDonorController } = require("../controllers/adminController");
const adminMiddleware = require("../middlewares/adminMiddleware");
const { getHospitalController } = require("../controllers/inventoryController");
//router object
const router = express.Router();
//routes

//get || donor list
router.get(
  "/donor-list",
  authMiddleware,
  adminMiddleware,
  getDonorsListController
);

//GET || HOSPITAL LIST
router.get(
  "/hospital-list",
  authMiddleware,
  adminMiddleware,
  getHospitalListController
);

router.get(
  "/org-list",
  authMiddleware,
  adminMiddleware,
  getOrgListController
);
router.delete('/delete-donor/:id', authMiddleware, adminMiddleware, deleteDonorController);


//export
module.exports = router;