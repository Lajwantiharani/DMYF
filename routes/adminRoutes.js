const express = require("express");

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

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
//router object
const router = express.Router();
//routes


// All admin endpoints must be authenticated and admin-only.
router.use(authMiddleware, adminMiddleware);

//get || donor list
router.get("/donor-list", getDonorsListController);

//GET || HOSPITAL LIST
router.get("/hospital-list", getHospitalListController);

router.get("/org-list", getOrgListController);

router.get(
  "/donor-export",
  exportDonorsExcelController
);

router.get(
  "/org-export",

  exportOrganizationsExcelController
);

router.get(
  "/receiver-export",

  exportReceiversExcelController
);

router.get(
  "/donated-export",

  exportDonatedExcelController
);

router.get(
  "/pending-verification-users",

  getPendingVerificationUsersController
);

router.put(
  "/profile-verification/:id",

  updateProfileVerificationStatusController
);

router.delete(
  "/delete-donor/:id",

  deleteDonorController
);

router.get(
  "/receiver-list",

  getReceiverListController
);

router.delete(
  "/delete-receiver/:id",

  deleteReceiverController
);

// ADD RECEIVER RECORD
router.post(
  "/add-receiver",

  addReceiverController
);
//export
module.exports = router;
