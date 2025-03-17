const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: [true, "role is required"],
      enum: ["admin", "organization", "donor", "hospital","receiver"],
    },
    name: {
      type: String,
      required: function () {
        if (this.role === "admin" || this.role === "donor" || this.role === "receiver") {
          return true;
        }
        return false;
      },
    },
    secretkey: {
      type: String,
      required: function () {
        return this.role === "admin";
      },
    },
    organizationName: {
      type: String,
      required: function () {
        if (this.role === "organization") {
          return true;
        }
        return false;
      },
    },
    hospitalName: {
      type: String,
      required: function () {
        if (this.role === "hospital") {
          return true;
        }
        return false;
      },
    },
    email: {
      type: String,
      require: [true, "email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    website: {
      type: String,
    },
    address: {
      type: String,
      required: function () {
        if (this.role === "donor" || this.role === "receiver" || this.role === "hospital" || this.role === "organization") {
          return true;
        }
        return false;
      },
    },
    phone: {
      type: String,
      required: function () {
        if (this.role === "donor" || this.role === "receiver" || this.role === "hospital" || this.role === "organization") {
          return true;
        }
        return false;
      },
    },
  },
  { timestamps: true }
);

//login call back

const loginController = () => {};
module.exports = mongoose.model("users", userSchema);
