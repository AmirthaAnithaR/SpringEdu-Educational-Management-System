const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },

    subjectCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },

    assignedTeacher: {
      type: String,
      trim: true,
      default: "",
    },

    credits: {
      type: Number,
      default: 0,
      min: 0,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    maxMarks: {
      type: Number,
      default: 100,
      min: 0,
    },

    passMarks: {
      type: Number,
      default: 35,
      min: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Subject", subjectSchema);
