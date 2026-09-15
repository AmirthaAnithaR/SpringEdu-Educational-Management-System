const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    audience: {
      type: String,
      enum: ["All", "Students", "Teachers", "Parents", "Classes"],
      default: "All",
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },

    category: {
      type: String,
      enum: ["General", "Exam", "Holiday", "Meeting", "Emergency"],
      default: "General",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdByName: {
      type: String,
      trim: true,
      default: "Admin",
    },

    publishDate: {
      type: Date,
      default: Date.now,
    },

    expiryDate: {
      type: Date,
    },

    attachmentUrl: {
      type: String,
      trim: true,
      default: "",
    },

    attachment: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["Published", "Draft", "Unpublished", "Active", "Inactive"],
      default: "Draft",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notice", noticeSchema);
