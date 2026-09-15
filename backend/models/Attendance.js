const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },

    subject: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Present", "Absent", "Late"],
      default: "Present",
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate attendance records
attendanceSchema.index({ student: 1, class: 1, subject: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
