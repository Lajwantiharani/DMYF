/**
 * Migrate data from MongoDB to PostgreSQL (Prisma).
 *
 * Requirements in .env:
 *   MONGO_URL=...
 *   DATABASE_URL=...
 *
 * Run AFTER: npm install && npm run db:setup
 *
 *   npm run migrate:from-mongo
 *
 * Safe to re-run: uses upsert by id (Mongo ObjectId string).
 */
require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");
const prisma = require("../config/prisma");

const idOf = (value) => {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (value instanceof ObjectId) return value.toString();
  if (value._id) return idOf(value._id);
  if (typeof value.toString === "function") return value.toString();
  return String(value);
};

const ROLES = new Set(["admin", "organization", "donor", "receiver"]);
const VERIFICATION = new Set([
  "not_requested",
  "pending",
  "approved",
  "rejected",
]);
const INVENTORY_TYPES = new Set(["in", "out"]);
const REQUEST_TYPES = new Set(["blood_request", "availability_request"]);
const TARGET_TYPES = new Set(["donor", "organization", "admin"]);
const REQUEST_STATUSES = new Set([
  "pending",
  "accepted",
  "rejected",
  "approved",
]);

const asDate = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const asString = (value, fallback = "") =>
  value == null ? fallback : String(value);

async function migrateUsers(db) {
  const docs = await db.collection("users").find({}).toArray();
  console.log(`Users found: ${docs.length}`);

  let ok = 0;
  let skipped = 0;

  for (const doc of docs) {
    const id = idOf(doc._id);
    const role = ROLES.has(doc.role) ? doc.role : null;
    if (!id || !role || !doc.email || !doc.password) {
      skipped += 1;
      console.warn("Skip user (missing fields):", id, doc.email, doc.role);
      continue;
    }

    const data = {
      role,
      name: doc.name ?? null,
      organizationName: doc.organizationName ?? null,
      email: String(doc.email).trim(),
      password: String(doc.password),
      website: doc.website ?? null,
      address: asString(doc.address, ""),
      phone: doc.phone ?? null,
      city: asString(doc.city, ""),
      bloodGroup: asString(doc.bloodGroup, ""),
      nukh: asString(doc.nukh, ""),
      akaah: asString(doc.akaah, ""),
      dob: asString(doc.dob, ""),
      profileVerificationStatus: VERIFICATION.has(doc.profileVerificationStatus)
        ? doc.profileVerificationStatus
        : "not_requested",
      profileVerificationRequestedAt: asDate(doc.profileVerificationRequestedAt),
      isVerified: Boolean(doc.isVerified),
      otp: doc.otp ?? null,
      otpExpires: asDate(doc.otpExpires),
      forgotPasswordRequestedAt: asDate(doc.forgotPasswordRequestedAt),
      lastActiveAt: asDate(doc.lastActiveAt),
      createdAt: asDate(doc.createdAt) || new Date(),
      updatedAt: asDate(doc.updatedAt) || new Date(),
    };

    await prisma.user.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
    ok += 1;
  }

  console.log(`Users migrated: ${ok}, skipped: ${skipped}`);
}

async function migrateInventory(db) {
  const collectionNames = await db.listCollections().toArray();
  const names = collectionNames.map((c) => c.name);
  const inventoryCollection = names.includes("inventories")
    ? "inventories"
    : names.includes("inventory")
      ? "inventory"
      : "inventories";

  const docs = await db.collection(inventoryCollection).find({}).toArray();
  console.log(`Inventory found (${inventoryCollection}): ${docs.length}`);

  let ok = 0;
  let skipped = 0;

  for (const doc of docs) {
    const id = idOf(doc._id);
    const organizationId = idOf(doc.organization);
    const inventoryType = INVENTORY_TYPES.has(doc.inventoryType)
      ? doc.inventoryType
      : null;
    const bloodGroup = asString(doc.bloodGroup, "");
    const quantity = Number(doc.quantity);

    if (!id || !organizationId || !inventoryType || !bloodGroup || !Number.isFinite(quantity)) {
      skipped += 1;
      console.warn("Skip inventory:", id);
      continue;
    }

    const orgExists = await prisma.user.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    if (!orgExists) {
      skipped += 1;
      console.warn("Skip inventory (org missing):", id, organizationId);
      continue;
    }

    let hospitalId = idOf(doc.hospital);
    let donorId = idOf(doc.donor);

    if (hospitalId) {
      const exists = await prisma.user.findUnique({
        where: { id: hospitalId },
        select: { id: true },
      });
      if (!exists) hospitalId = null;
    }
    if (donorId) {
      const exists = await prisma.user.findUnique({
        where: { id: donorId },
        select: { id: true },
      });
      if (!exists) donorId = null;
    }

    const data = {
      inventoryType,
      bloodGroup,
      quantity: Math.trunc(quantity),
      email: asString(doc.email, ""),
      organizationId,
      hospitalId,
      donorId,
      createdAt: asDate(doc.createdAt) || new Date(),
      updatedAt: asDate(doc.updatedAt) || new Date(),
    };

    await prisma.inventory.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
    ok += 1;
  }

  console.log(`Inventory migrated: ${ok}, skipped: ${skipped}`);
}

async function migrateReceiverRequests(db) {
  const collectionNames = await db.listCollections().toArray();
  const names = collectionNames.map((c) => c.name);
  const collection = names.includes("receiver_requests")
    ? "receiver_requests"
    : names.find((n) => n.toLowerCase().includes("receiver")) || "receiver_requests";

  const docs = await db.collection(collection).find({}).toArray();
  console.log(`Receiver requests found (${collection}): ${docs.length}`);

  let ok = 0;
  let skipped = 0;

  for (const doc of docs) {
    const id = idOf(doc._id);
    const receiverId = idOf(doc.receiver);
    const targetUserId = idOf(doc.targetUser);
    const requestType = REQUEST_TYPES.has(doc.requestType) ? doc.requestType : null;
    const targetType = TARGET_TYPES.has(doc.targetType) ? doc.targetType : null;
    const status = REQUEST_STATUSES.has(doc.status) ? doc.status : "pending";
    const bloodGroup = asString(doc.bloodGroup, "");
    const quantity = Number(doc.quantity);

    if (
      !id ||
      !receiverId ||
      !requestType ||
      !targetType ||
      !bloodGroup ||
      !Number.isFinite(quantity)
    ) {
      skipped += 1;
      console.warn("Skip request:", id);
      continue;
    }

    const receiverExists = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });
    if (!receiverExists) {
      skipped += 1;
      console.warn("Skip request (receiver missing):", id);
      continue;
    }

    let safeTargetUserId = targetUserId;
    if (safeTargetUserId) {
      const targetExists = await prisma.user.findUnique({
        where: { id: safeTargetUserId },
        select: { id: true },
      });
      if (!targetExists) safeTargetUserId = null;
    }

    const data = {
      requestType,
      receiverId,
      targetUserId: safeTargetUserId,
      targetType,
      bloodGroup,
      city: asString(doc.city, ""),
      quantity: Math.trunc(quantity),
      status,
      createdAt: asDate(doc.createdAt) || new Date(),
      updatedAt: asDate(doc.updatedAt) || new Date(),
    };

    try {
      await prisma.receiverRequest.upsert({
        where: { id },
        create: { id, ...data },
        update: data,
      });
      ok += 1;
    } catch (error) {
      // Unique (receiverId, targetUserId, requestType) conflict on re-run variants
      if (error?.code === "P2002") {
        skipped += 1;
        console.warn("Skip request (unique conflict):", id);
      } else {
        throw error;
      }
    }
  }

  console.log(`Receiver requests migrated: ${ok}, skipped: ${skipped}`);
}

async function migrateInquiries(db) {
  const docs = await db.collection("inquiries").find({}).toArray();
  console.log(`Inquiries found: ${docs.length}`);

  let ok = 0;
  let skipped = 0;
  let messagesOk = 0;

  for (const doc of docs) {
    const id = idOf(doc._id);
    const userId = idOf(doc.user);
    if (!id || !userId) {
      skipped += 1;
      continue;
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!userExists) {
      skipped += 1;
      console.warn("Skip inquiry (user missing):", id);
      continue;
    }

    const inquiryData = {
      userId,
      lastMessageAt: asDate(doc.lastMessageAt),
      lastReadAtUser: asDate(doc.lastReadAtUser),
      lastReadAtAdmin: asDate(doc.lastReadAtAdmin),
      createdAt: asDate(doc.createdAt) || new Date(),
      updatedAt: asDate(doc.updatedAt) || new Date(),
    };

    await prisma.inquiry.upsert({
      where: { id },
      create: { id, ...inquiryData },
      update: inquiryData,
    });

    // Replace messages for this inquiry (idempotent enough for re-run)
    await prisma.inquiryMessage.deleteMany({ where: { inquiryId: id } });

    const messages = Array.isArray(doc.messages) ? doc.messages : [];
    for (const msg of messages) {
      const messageId = idOf(msg._id) || undefined;
      const senderId = idOf(msg.sender);
      const senderRole = ROLES.has(msg.senderRole) ? msg.senderRole : null;
      const message = asString(msg.message, "").trim();
      if (!senderId || !senderRole || !message) continue;

      const senderExists = await prisma.user.findUnique({
        where: { id: senderId },
        select: { id: true },
      });
      if (!senderExists) continue;

      await prisma.inquiryMessage.create({
        data: {
          ...(messageId ? { id: messageId } : {}),
          inquiryId: id,
          senderId,
          senderRole,
          message: message.slice(0, 2000),
          createdAt: asDate(msg.createdAt) || new Date(),
          updatedAt: asDate(msg.updatedAt) || new Date(),
        },
      });
      messagesOk += 1;
    }

    ok += 1;
  }

  console.log(
    `Inquiries migrated: ${ok}, skipped: ${skipped}, messages: ${messagesOk}`,
  );
}

async function main() {
  const mongoUrl = process.env.MONGO_URL;
  const databaseUrl = process.env.DATABASE_URL;

  if (!mongoUrl) {
    console.error("Missing MONGO_URL in .env");
    process.exit(1);
  }
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL in .env");
    process.exit(1);
  }

  const client = new MongoClient(mongoUrl);
  await client.connect();
  const db = client.db();

  console.log("Connected to MongoDB:", db.databaseName);
  console.log("Starting migration...\n");

  await migrateUsers(db);
  await migrateInventory(db);
  await migrateReceiverRequests(db);
  await migrateInquiries(db);

  console.log("\nMigration finished.");
  await client.close();
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("Migration failed:", error);
  try {
    await prisma.$disconnect();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});
