const mongoose = require("mongoose");

const inquiryMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["admin", "organization", "donor", "hospital", "receiver"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true },
);

const inquirySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },
    messages: {
      type: [inquiryMessageSchema],
      default: [],
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastReadAtUser: {
      type: Date,
      default: null,
    },
    lastReadAtAdmin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("inquiries", inquirySchema);

