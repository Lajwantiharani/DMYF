const SENSITIVE_USER_FIELDS = [
  "password",
  "otp",
  "otpExpires",
  "forgotPasswordRequestedAt",
];

const withMongoStyleId = (record) => {
  if (!record || typeof record !== "object") return record;
  if (Array.isArray(record)) return record.map(withMongoStyleId);

  const { id, ...rest } = record;
  const mapped = { ...rest };
  if (id !== undefined) {
    mapped._id = id;
    mapped.id = id;
  }
  return mapped;
};

const mapUserPublic = (user, { includeSensitive = false } = {}) => {
  if (!user) return null;
  const mapped = withMongoStyleId(user);
  if (!includeSensitive) {
    for (const field of SENSITIVE_USER_FIELDS) {
      delete mapped[field];
    }
  }
  return mapped;
};

const mapInventory = (item) => {
  if (!item) return null;
  const mapped = withMongoStyleId(item);
  if (item.organizationId !== undefined) mapped.organization = item.organizationId;
  if (item.hospitalId !== undefined) mapped.hospital = item.hospitalId;
  if (item.donorId !== undefined) mapped.donor = item.donorId;

  if (item.organization && typeof item.organization === "object") {
    mapped.organization = mapUserPublic(item.organization);
  }
  if (item.hospital && typeof item.hospital === "object") {
    mapped.hospital = mapUserPublic(item.hospital);
  }
  if (item.donor && typeof item.donor === "object") {
    mapped.donor = mapUserPublic(item.donor);
  }

  delete mapped.organizationId;
  delete mapped.hospitalId;
  delete mapped.donorId;
  return mapped;
};

const mapReceiverRequest = (request) => {
  if (!request) return null;
  const mapped = withMongoStyleId(request);
  mapped.receiver = request.receiver
    ? mapUserPublic(request.receiver)
    : request.receiverId;
  mapped.targetUser = request.targetUser
    ? mapUserPublic(request.targetUser)
    : request.targetUserId;
  delete mapped.receiverId;
  delete mapped.targetUserId;
  return mapped;
};

const mapInquiryMessage = (message) => {
  if (!message) return null;
  const mapped = withMongoStyleId(message);
  mapped.sender = message.sender
    ? mapUserPublic(message.sender)
    : message.senderId;
  delete mapped.senderId;
  delete mapped.inquiryId;
  return mapped;
};

const mapInquiry = (inquiry) => {
  if (!inquiry) return null;
  const mapped = withMongoStyleId(inquiry);
  mapped.user = inquiry.user ? mapUserPublic(inquiry.user) : inquiry.userId;
  mapped.messages = Array.isArray(inquiry.messages)
    ? inquiry.messages.map(mapInquiryMessage)
    : [];
  delete mapped.userId;
  return mapped;
};

module.exports = {
  SENSITIVE_USER_FIELDS,
  withMongoStyleId,
  mapUserPublic,
  mapInventory,
  mapReceiverRequest,
  mapInquiry,
  mapInquiryMessage,
};
