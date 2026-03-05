const mongoose = require("mongoose");

const receiverRequestSchema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      enum: ["blood_request", "availability_request"],
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    targetType: {
      type: String,
      enum: ["donor", "organization", "admin"],
      required: true,
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ["O+", "O-", "AB+", "AB-", "A+", "A-", "B+", "B-"],
    },
    city: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "approved"],
      default: "pending",
    },
  },
  { timestamps: true },
);

receiverRequestSchema.index(
  { receiver: 1, targetUser: 1, requestType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      requestType: "blood_request",
      targetUser: { $exists: true, $ne: null },
    },
  },
);

module.exports = mongoose.model("receiver_requests", receiverRequestSchema);
