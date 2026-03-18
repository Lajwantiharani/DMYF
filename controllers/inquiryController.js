const InquiryModel = require("../models/InquiryModel");
const userModel = require("../models/userModel");

const toDisplayName = (user) =>
  user?.name || user?.organizationName || user?.hospitalName || "User";

const hasUnread = (messages = [], lastReadAt = null, viewerRole = "") => {
  if (!messages.length) return false;
  const lastReadTime = lastReadAt ? new Date(lastReadAt).getTime() : 0;
  return messages.some((m) => {
    const messageTime = new Date(m.createdAt).getTime();
    return messageTime > lastReadTime && m.senderRole !== viewerRole;
  });
};

const getOrCreateThreadForUser = async (userId) => {
  const existing = await InquiryModel.findOne({ user: userId });
  if (existing) return existing;
  return InquiryModel.create({ user: userId, messages: [], lastMessageAt: null });
};

const PK_TIMEZONE_OFFSET_MS = 5 * 60 * 60 * 1000;

const getPakistanDayRange = (now = new Date()) => {
  const pkNow = new Date(now.getTime() + PK_TIMEZONE_OFFSET_MS);
  const pkMidnightUtc = Date.UTC(
    pkNow.getUTCFullYear(),
    pkNow.getUTCMonth(),
    pkNow.getUTCDate(),
    0,
    0,
    0,
    0,
  );
  const start = new Date(pkMidnightUtc - PK_TIMEZONE_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

const countUserMessagesTodayPk = (thread, userId) => {
  if (!thread?.messages?.length) return 0;
  const { start, end } = getPakistanDayRange(new Date());
  const startMs = start.getTime();
  const endMs = end.getTime();

  return thread.messages.reduce((count, m) => {
    if (!m) return count;
    if (String(m.senderRole) === "admin") return count;
    if (String(m.sender) !== String(userId)) return count;
    const messageTime = new Date(m.createdAt).getTime();
    if (Number.isNaN(messageTime)) return count;
    return messageTime >= startMs && messageTime < endMs ? count + 1 : count;
  }, 0);
};

const serializeUserThread = (thread, user) => {
  const todaysCount = countUserMessagesTodayPk(thread, user._id);
  const DAILY_LIMIT = 3;
  return {
    _id: thread._id,
    user: { _id: user._id, role: user.role, name: toDisplayName(user), email: user.email },
    messages: thread.messages || [],
    lastMessageAt: thread.lastMessageAt,
    lastReadAtUser: thread.lastReadAtUser,
    lastReadAtAdmin: thread.lastReadAtAdmin,
    unreadForUser: hasUnread(thread.messages, thread.lastReadAtUser, user.role),
    messagesUsedToday: todaysCount,
    dailyLimit: DAILY_LIMIT,
  };
};

// USER: get their thread
const getMyInquiryController = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await userModel.findById(userId).select("role name organizationName hospitalName email");
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    const thread = await getOrCreateThreadForUser(userId);
    await thread.populate("messages.sender", "name organizationName hospitalName email role");

    return res.status(200).send({
      success: true,
      thread: serializeUserThread(thread, user),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, message: "Error fetching inquiry", error: error.message });
  }
};

// USER: send message
const sendMyInquiryMessageController = async (req, res) => {
  try {
    const userId = req.body.userId;
    const message = String(req.body.message || "").trim();
    if (!message) {
      return res.status(400).send({ success: false, message: "Message is required" });
    }

    const user = await userModel.findById(userId).select("role");
    if (!user || user.role === "admin") {
      return res.status(403).send({ success: false, message: "Only non-admin users can send inquiries here" });
    }

    const thread = await getOrCreateThreadForUser(userId);

    const todaysCount = countUserMessagesTodayPk(thread, userId);
    const DAILY_LIMIT = 3;
    if (todaysCount >= DAILY_LIMIT) {
      return res.status(429).send({
        success: false,
        message: `Daily limit reached. You can send up to ${DAILY_LIMIT} messages per day.`,
        limit: DAILY_LIMIT,
        used: todaysCount,
      });
    }

    thread.messages.push({
      sender: userId,
      senderRole: user.role,
      message,
    });
    thread.lastMessageAt = new Date();
    thread.lastReadAtUser = new Date();
    await thread.save();

    await thread.populate("messages.sender", "name organizationName hospitalName email role");

    const userDisplay = await userModel.findById(userId).select("role name organizationName hospitalName email");

    return res.status(201).send({
      success: true,
      message: "Message sent",
      thread: serializeUserThread(thread, userDisplay),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, message: "Error sending inquiry", error: error.message });
  }
};

// USER: mark read
const markMyInquiryReadController = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await userModel.findById(userId).select("role");
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    const thread = await getOrCreateThreadForUser(userId);
    thread.lastReadAtUser = new Date();
    await thread.save();

    return res.status(200).send({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, message: "Error marking as read", error: error.message });
  }
};

// ADMIN: list threads
const listInquiriesAdminController = async (req, res) => {
  try {
    const threads = await InquiryModel.find({})
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate("user", "name organizationName hospitalName email role phone city");

    const items = threads.map((t) => ({
      _id: t._id,
      user: {
        _id: t.user?._id,
        role: t.user?.role,
        name: toDisplayName(t.user),
        email: t.user?.email,
      },
      lastMessageAt: t.lastMessageAt,
      lastReadAtUser: t.lastReadAtUser,
      lastReadAtAdmin: t.lastReadAtAdmin,
      unreadForAdmin: hasUnread(t.messages, t.lastReadAtAdmin, "admin"),
      lastMessagePreview: t.messages?.length
        ? t.messages[t.messages.length - 1].message.slice(0, 80)
        : "",
    }));

    return res.status(200).send({ success: true, items });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, message: "Error fetching inquiries", error: error.message });
  }
};

// ADMIN: get thread details
const getInquiryAdminController = async (req, res) => {
  try {
    const { id } = req.params;
    const thread = await InquiryModel.findById(id)
      .populate("user", "name organizationName hospitalName email role")
      .populate("messages.sender", "name organizationName hospitalName email role");

    if (!thread) {
      return res.status(404).send({ success: false, message: "Inquiry not found" });
    }

    return res.status(200).send({
      success: true,
      thread,
      unreadForAdmin: hasUnread(thread.messages, thread.lastReadAtAdmin, "admin"),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, message: "Error fetching inquiry", error: error.message });
  }
};

// ADMIN: reply
const replyInquiryAdminController = async (req, res) => {
  try {
    const { id } = req.params;
    const message = String(req.body.message || "").trim();
    if (!message) {
      return res.status(400).send({ success: false, message: "Message is required" });
    }

    const adminId = req.body.userId;
    const admin = await userModel.findById(adminId).select("role");
    if (!admin || admin.role !== "admin") {
      return res.status(403).send({ success: false, message: "Admin only" });
    }

    const thread = await InquiryModel.findById(id);
    if (!thread) {
      return res.status(404).send({ success: false, message: "Inquiry not found" });
    }

    thread.messages.push({
      sender: adminId,
      senderRole: "admin",
      message,
    });
    thread.lastMessageAt = new Date();
    thread.lastReadAtAdmin = new Date();
    await thread.save();

    await thread.populate("user", "name organizationName hospitalName email role");
    await thread.populate("messages.sender", "name organizationName hospitalName email role");

    return res.status(201).send({ success: true, message: "Reply sent", thread });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, message: "Error replying", error: error.message });
  }
};

// ADMIN: mark read
const markInquiryReadAdminController = async (req, res) => {
  try {
    const { id } = req.params;
    const thread = await InquiryModel.findById(id);
    if (!thread) {
      return res.status(404).send({ success: false, message: "Inquiry not found" });
    }

    thread.lastReadAtAdmin = new Date();
    await thread.save();

    return res.status(200).send({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, message: "Error marking as read", error: error.message });
  }
};

module.exports = {
  getMyInquiryController,
  sendMyInquiryMessageController,
  markMyInquiryReadController,
  listInquiriesAdminController,
  getInquiryAdminController,
  replyInquiryAdminController,
  markInquiryReadAdminController,
};
