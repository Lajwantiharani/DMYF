const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const { createRateLimiter } = require("../middlewares/rateLimit");
const {
  getMyInquiryController,
  sendMyInquiryMessageController,
  markMyInquiryReadController,
  listInquiriesAdminController,
  getInquiryAdminController,
  replyInquiryAdminController,
  markInquiryReadAdminController,
} = require("../controllers/inquiryController");

const router = express.Router();

router.use(authMiddleware);

// USER (non-admin)
router.get("/me", getMyInquiryController);
router.post(
  "/me/message",
  createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 30,
    keyGenerator: (req) => `${req.ip}:${req.body?.userId || ""}:/inquiries/me/message`,
    message: "Too many messages. Please try again later.",
  }),
  sendMyInquiryMessageController,
);
router.post("/me/read", markMyInquiryReadController);

// ADMIN
router.use("/admin", adminMiddleware);
router.get("/admin/threads", listInquiriesAdminController);
router.get("/admin/threads/:id", getInquiryAdminController);
router.post("/admin/threads/:id/reply", replyInquiryAdminController);
router.post("/admin/threads/:id/read", markInquiryReadAdminController);

module.exports = router;
