const express = require("express");

const {
  getDonorsListController,
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
  getDashboardStatsController,
} = require("../controllers/adminController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const { createRateLimiter } = require("../middlewares/rateLimit");
//router object
const router = express.Router();
//routes

const adminLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => `admin:${req.ip}:${req.path}`,
  message: "Too many admin requests. Please try again later.",
});

// All admin endpoints must be authenticated and admin-only.
router.use(authMiddleware, adminMiddleware, adminLimiter);

router.get("/dashboard-stats", getDashboardStatsController);

//get || donor list
router.get("/donor-list", getDonorsListController);


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
