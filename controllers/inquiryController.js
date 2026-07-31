const prisma = require("../config/prisma");
const { mapInquiry, mapInquiryMessage } = require("../utils/serialize");

const INQUIRY_INCLUDE = {
  user: {
    select: {
      id: true,
      role: true,
      name: true,
      organizationName: true,
      email: true,
      phone: true,
      city: true,
    },
  },
  messages: {
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: {
          id: true,
          role: true,
          name: true,
          organizationName: true,
          email: true,
        },
      },
    },
  },
};

const toDisplayName = (user) =>
  user?.name || user?.organizationName || "User";

const hasUnread = (messages = [], lastReadAt = null, viewerRole = "") => {
  if (!messages.length) return false;
  const lastReadTime = lastReadAt ? new Date(lastReadAt).getTime() : 0;
  return messages.some((m) => {
    const messageTime = new Date(m.createdAt).getTime();
    return messageTime > lastReadTime && m.senderRole !== viewerRole;
  });
};

const getOrCreateThreadForUser = async (userId) => {
  const existing = await prisma.inquiry.findUnique({
    where: { userId },
    include: INQUIRY_INCLUDE,
  });
  if (existing) return existing;

  return prisma.inquiry.create({
    data: { userId },
    include: INQUIRY_INCLUDE,
  });
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
    if (String(m.senderId) !== String(userId)) return count;
    const messageTime = new Date(m.createdAt).getTime();
    if (Number.isNaN(messageTime)) return count;
    return messageTime >= startMs && messageTime < endMs ? count + 1 : count;
  }, 0);
};

const serializeUserThread = (thread, user) => {
  const todaysCount = countUserMessagesTodayPk(thread, user.id);
  const DAILY_LIMIT = 3;
  return {
    _id: thread.id,
    user: {
      _id: user.id,
      role: user.role,
      name: toDisplayName(user),
      email: user.email,
    },
    messages: (thread.messages || []).map(mapInquiryMessage),
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        name: true,
        organizationName: true,
        email: true,
      },
    });
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    const thread = await getOrCreateThreadForUser(userId);

    return res.status(200).send({
      success: true,
      thread: serializeUserThread(thread, user),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, message: "Error fetching inquiry" });
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true, organizationName: true, email: true },
    });
    if (!user || user.role === "admin") {
      return res.status(403).send({
        success: false,
        message: "Only non-admin users can send inquiries here",
      });
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

    await prisma.inquiryMessage.create({
      data: {
        inquiryId: thread.id,
        senderId: userId,
        senderRole: user.role,
        message,
      },
    });

    await prisma.inquiry.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: new Date(),
        lastReadAtUser: new Date(),
      },
    });

    const updatedThread = await prisma.inquiry.findUnique({
      where: { id: thread.id },
      include: INQUIRY_INCLUDE,
    });

    // Reuse the user object already fetched instead of querying again
    return res.status(201).send({
      success: true,
      message: "Message sent",
      thread: serializeUserThread(updatedThread, user),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, message: "Error sending inquiry" });
  }
};

// USER: mark read
const markMyInquiryReadController = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    // Only update if thread exists, don't create one for a read operation
    const existingThread = await prisma.inquiry.findUnique({ where: { userId } });
    if (existingThread) {
      await prisma.inquiry.update({
        where: { userId },
        data: { lastReadAtUser: new Date() },
      });
    }

    return res.status(200).send({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, message: "Error marking as read" });
  }
};

// ADMIN: list threads
const listInquiriesAdminController = async (req, res) => {
  try {
    const threads = await prisma.inquiry.findMany({
      orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            organizationName: true,
            email: true,
            role: true,
            phone: true,
            city: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const items = threads
      .filter((t) => t.user && Array.isArray(t.messages) && t.messages.length > 0)
      .map((t) => ({
        _id: t.id,
        user: {
          _id: t.user.id,
          role: t.user.role,
          name: toDisplayName(t.user),
          email: t.user.email,
        },
        lastMessageAt: t.lastMessageAt,
        lastReadAtUser: t.lastReadAtUser,
        lastReadAtAdmin: t.lastReadAtAdmin,
        unreadForAdmin: hasUnread(t.messages, t.lastReadAtAdmin, "admin"),
        lastMessagePreview: t.messages.length
          ? t.messages[t.messages.length - 1].message.slice(0, 80)
          : "",
      }));

    return res.status(200).send({ success: true, items });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, message: "Error fetching inquiries" });
  }
};

// ADMIN: get thread details
const getInquiryAdminController = async (req, res) => {
  try {
    const { id } = req.params;
    const thread = await prisma.inquiry.findUnique({
      where: { id },
      include: INQUIRY_INCLUDE,
    });

    if (!thread) {
      return res.status(404).send({ success: false, message: "Inquiry not found" });
    }

    return res.status(200).send({
      success: true,
      thread: mapInquiry(thread),
      unreadForAdmin: hasUnread(thread.messages, thread.lastReadAtAdmin, "admin"),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, message: "Error fetching inquiry" });
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
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });
    if (!admin || admin.role !== "admin") {
      return res.status(403).send({ success: false, message: "Admin only" });
    }

    const thread = await prisma.inquiry.findUnique({ where: { id } });
    if (!thread) {
      return res.status(404).send({ success: false, message: "Inquiry not found" });
    }

    await prisma.inquiryMessage.create({
      data: {
        inquiryId: thread.id,
        senderId: adminId,
        senderRole: "admin",
        message,
      },
    });

    await prisma.inquiry.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: new Date(),
        lastReadAtAdmin: new Date(),
      },
    });

    const updatedThread = await prisma.inquiry.findUnique({
      where: { id: thread.id },
      include: INQUIRY_INCLUDE,
    });

    return res.status(201).send({
      success: true,
      message: "Reply sent",
      thread: mapInquiry(updatedThread),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, message: "Error replying" });
  }
};

// ADMIN: mark read
const markInquiryReadAdminController = async (req, res) => {
  try {
    const { id } = req.params;
    const thread = await prisma.inquiry.findUnique({ where: { id } });
    if (!thread) {
      return res.status(404).send({ success: false, message: "Inquiry not found" });
    }

    await prisma.inquiry.update({
      where: { id },
      data: { lastReadAtAdmin: new Date() },
    });

    return res.status(200).send({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, message: "Error marking as read" });
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