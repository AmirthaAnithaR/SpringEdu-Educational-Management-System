const mongoose = require("mongoose");

const marksSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    examType: {
      type: String,
      enum: ["Unit Test 1", "Unit Test 2", "Mid Term", "Quarterly", "Half Yearly", "Model Exam", "Annual Exam"],
      required: true,
    },

    academicYear: {
      type: String,
      required: true,
      trim: true,
    },

    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },

    maximumMarks: {
      type: Number,
      required: true,
      default: 100,
      min: 1,
    },

    grade: {
      type: String,
      required: true,
      trim: true,
    },

    remarks: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

marksSchema.index(
  {
    student: 1,
    class: 1,
    subject: 1,
    examType: 1,
    academicYear: 1,
  },
  { unique: true }
);

module.exports = mongoose.model("Marks", marksSchema);
