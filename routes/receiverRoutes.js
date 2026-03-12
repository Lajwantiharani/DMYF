const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  searchAvailabilityController,
  sendBloodRequestController,
  requestAvailabilityController,
  getSentTargetsController,
  getIncomingRequestsController,
  updateIncomingRequestStatusController,

  getReceiverRequestsController,
} = require("../controllers/receiverController");

const router = express.Router();

router.post("/search-availability", authMiddleware, searchAvailabilityController);
router.post("/send-request", authMiddleware, sendBloodRequestController);
router.post(
  "/request-availability",
  authMiddleware,
  requestAvailabilityController,
);
router.get("/sent-targets", authMiddleware, getSentTargetsController);
router.get("/incoming-requests", authMiddleware, getIncomingRequestsController);

router.get("/my-requests", authMiddleware, getReceiverRequestsController);
router.put(
  "/incoming-requests/:requestId/status",
  authMiddleware,
  updateIncomingRequestStatusController,
);

module.exports = router;
