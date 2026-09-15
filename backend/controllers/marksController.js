const Marks = require("../models/Marks");
const Class = require("../models/Class");
const Student = require("../models/Student");

const getGradeAndRemarks = (marksObtained, maximumMarks) => {
  const percentage = maximumMarks > 0 ? (marksObtained / maximumMarks) * 100 : 0;

  if (percentage >= 90) return { grade: "A+", remarks: "Excellent" };
  if (percentage >= 80) return { grade: "A", remarks: "Very Good" };
  if (percentage >= 70) return { grade: "B+", remarks: "Good" };
  if (percentage >= 60) return { grade: "B", remarks: "Average" };
  if (percentage >= 50) return { grade: "C", remarks: "Needs Improvement" };
  if (percentage >= 40) return { grade: "D", remarks: "Poor" };
  return { grade: "F", remarks: "Fail" };
};

const getStudentsByMarksClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.classId);

    if (!classItem) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const students = await Student.find({
      className: classItem.className,
      section: classItem.section,
    })
      .select("admissionNumber rollNumber name gender profileImage")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      class: classItem,
      students: students.map((student) => ({
        _id: student._id,
        studentId: student.admissionNumber,
        fullName: student.name,
        gender: student.gender,
        rollNumber: student.rollNumber,
        photo: student.profileImage,
      })),
    });
  } catch (error) {
    console.error("Get marks class students error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch class students", error: error.message });
  }
};

const saveMarks = async (req, res) => {
  try {
    const { teacherId, classId, subject, examType, academicYear, marks } = req.body;

    if (!teacherId || !classId || !subject || !examType || !academicYear || !Array.isArray(marks) || marks.length === 0) {
      return res.status(400).json({ success: false, message: "Teacher, class, subject, exam type, academic year, and marks are required." });
    }

    const invalidRecord = marks.find((record) => {
      const marksObtained = Number(record.marksObtained);
      const maximumMarks = Number(record.maximumMarks);
      return Number.isNaN(marksObtained) || Number.isNaN(maximumMarks) || marksObtained < 0 || maximumMarks <= 0 || marksObtained > maximumMarks;
    });

    if (invalidRecord) {
      return res.status(400).json({ success: false, message: "Marks must be between 0 and maximum marks." });
    }

    const duplicate = await Marks.findOne({
      student: { $in: marks.map((record) => record.studentId) },
      class: classId,
      subject,
      examType,
      academicYear,
    });

    if (duplicate) {
      return res.status(409).json({ success: false, message: "Marks already exist for this class, subject, exam type, and academic year." });
    }

    const records = marks.map((record) => {
      const marksObtained = Number(record.marksObtained);
      const maximumMarks = Number(record.maximumMarks);
      const generated = getGradeAndRemarks(marksObtained, maximumMarks);

      return {
        teacher: teacherId,
        class: classId,
        student: record.studentId,
        subject,
        examType,
        academicYear,
        marksObtained,
        maximumMarks,
        grade: record.grade || generated.grade,
        remarks: record.remarks || generated.remarks,
      };
    });

    await Marks.insertMany(records, { ordered: true });

    return res.status(201).json({ success: true, message: "Marks saved successfully." });
  } catch (error) {
    console.error("Save marks error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Marks already exist for this class, subject, exam type, and academic year." });
    }
    return res.status(500).json({ success: false, message: "Failed to save marks", error: error.message });
  }
};

const updateMarks = async (req, res) => {
  try {
    const { marksObtained, maximumMarks, grade, remarks } = req.body;
    const numericMarks = Number(marksObtained);
    const numericMaximum = Number(maximumMarks);

    if (Number.isNaN(numericMarks) || Number.isNaN(numericMaximum) || numericMarks < 0 || numericMaximum <= 0 || numericMarks > numericMaximum) {
      return res.status(400).json({ success: false, message: "Marks must be between 0 and maximum marks." });
    }

    const generated = getGradeAndRemarks(numericMarks, numericMaximum);
    const mark = await Marks.findByIdAndUpdate(
      req.params.id,
      {
        marksObtained: numericMarks,
        maximumMarks: numericMaximum,
        grade: grade || generated.grade,
        remarks: remarks || generated.remarks,
      },
      { new: true, runValidators: true }
    );

    if (!mark) {
      return res.status(404).json({ success: false, message: "Marks record not found" });
    }

    return res.status(200).json({ success: true, message: "Marks updated successfully.", marks: mark });
  } catch (error) {
    console.error("Update marks error:", error);
    return res.status(500).json({ success: false, message: "Failed to update marks", error: error.message });
  }
};

const getStudentMarks = async (req, res) => {
  try {
    const marks = await Marks.find({ student: req.params.studentId })
      .populate("teacher", "fullName employeeId")
      .populate("class", "className section")
      .populate("student", "name rollNumber")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: marks.length, marks });
  } catch (error) {
    console.error("Get student marks error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch student marks", error: error.message });
  }
};

module.exports = {
  getStudentsByMarksClass,
  saveMarks,
  updateMarks,
  getStudentMarks,
};
