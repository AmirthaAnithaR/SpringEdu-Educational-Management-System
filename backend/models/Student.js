const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    admissionNumber: {
      type: String,
      required: true,
      unique: true,
    },

    rollNumber: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    className: {
      type: String,
      required: true,
    },

    section: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      default: "",
    },

    fatherName: {
      type: String,
      default: "",
    },

    motherName: {
      type: String,
      default: "",
    },

    parentPhone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    bloodGroup: {
      type: String,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Student", studentSchema);