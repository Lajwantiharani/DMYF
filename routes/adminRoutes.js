const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getDonorsListController,
  getHospitalListController,
  getOrgListController,
  deleteDonorController,
  addReceiverController,
  getReceiverListController,
  deleteReceiverController,
  exportDonorsExcelController,
  exportOrganizationsExcelController,
  exportReceiversExcelController,
  exportDonatedExcelController,
  getPendingVerificationUsersController,
  updateProfileVerificationStatusController,
} = require("../controllers/adminController");
const adminMiddleware = require("../middlewares/adminMiddleware");
const { getHospitalController } = require("../controllers/inventoryController");
//router object
const router = express.Router();
//routes

//get || donor list
router.get(
  "/donor-list",
  authMiddleware,
  getDonorsListController
);

//GET || HOSPITAL LIST
router.get(
  "/hospital-list",
  authMiddleware,
  adminMiddleware,
  getHospitalListController
);

router.get("/org-list", authMiddleware, adminMiddleware, getOrgListController);

router.get(
  "/donor-export",
  authMiddleware,
  adminMiddleware,
  exportDonorsExcelController
);

router.get(
  "/org-export",
  authMiddleware,
  adminMiddleware,
  exportOrganizationsExcelController
);

router.get(
  "/receiver-export",
  authMiddleware,
  adminMiddleware,
  exportReceiversExcelController
);

router.get(
  "/donated-export",
  authMiddleware,
  adminMiddleware,
  exportDonatedExcelController
);

router.get(
  "/pending-verification-users",
  authMiddleware,
  adminMiddleware,
  getPendingVerificationUsersController
);

router.put(
  "/profile-verification/:id",
  authMiddleware,
  adminMiddleware,
  updateProfileVerificationStatusController
);

router.delete(
  "/delete-donor/:id",
  authMiddleware,
  adminMiddleware,
  deleteDonorController
);

router.get(
  "/receiver-list",
  authMiddleware,
  getReceiverListController
);

router.delete(
  "/delete-receiver/:id",
  authMiddleware,
  adminMiddleware,
  deleteReceiverController
);

// ADD RECEIVER RECORD
router.post(
  "/add-receiver",
  authMiddleware,
  adminMiddleware,
  addReceiverController
);
//export
module.exports = router;
