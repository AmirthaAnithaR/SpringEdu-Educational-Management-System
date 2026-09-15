const Class = require("../models/Class");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");

const getClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("classTeacher", "fullName employeeId department subject")
      .sort({ createdAt: -1 });
    const withCounts = await Promise.all(
      classes.map(async (classItem) => {
        const totalStudents = await Student.countDocuments({
          className: classItem.className,
          section: classItem.section,
        });
        return { ...classItem.toObject(), totalStudents };
      })
    );
    return res.status(200).json({ success: true, count: withCounts.length, classes: withCounts });
  } catch (error) {
    console.error("Get classes error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch classes", error: error.message });
  }
};

const getClassesByTeacherUser = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.params.userId });

    if (!teacher) {
      return res.status(200).json({ success: true, count: 0, classes: [] });
    }

    const classes = await Class.find({ classTeacher: teacher._id })
      .select("className section subject academicYear totalStudents status classTeacher")
      .populate("classTeacher", "fullName employeeId")
      .sort({ className: 1, section: 1 });

    const withCounts = await Promise.all(
      classes.map(async (classItem) => {
        const totalStudents = await Student.countDocuments({
          className: classItem.className,
          section: classItem.section,
        });
        return { ...classItem.toObject(), totalStudents };
      })
    );

    return res.status(200).json({ success: true, count: withCounts.length, classes: withCounts });
  } catch (error) {
    console.error("Get teacher classes error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch teacher classes", error: error.message });
  }
};

const createClass = async (req, res) => {
  try {
    const {
      className,
      section,
      subject,
      roomNumber,
      classTeacher,
      academicYear,
      description,
      status,
    } = req.body;

    const requiredFields = { className, section, subject, academicYear, classTeacher };
    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value)
      .map(([field]) => field);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required field${missingFields.length > 1 ? "s" : ""}: ${missingFields.join(", ")}`,
      });
    }

    const classItem = await Class.create({
      className,
      section,
      subject,
      roomNumber,
      classTeacher,
      academicYear,
      description,
      status,
    });
    return res.status(201).json({ success: true, message: "Class added successfully", class: classItem });
  } catch (error) {
    console.error("Create class error:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: errors.join(", "), errors });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: `Invalid ${error.path}: ${error.value}` });
    }
    return res.status(500).json({ success: false, message: "Failed to add class", error: error.message });
  }
};
const updateClass = async (req, res) => {
  try {
    const {
      className,
      section,
      subject,
      roomNumber,
      classTeacher,
      academicYear,
      description,
      status,
    } = req.body;

    const classItem = await Class.findByIdAndUpdate(
      req.params.id,
      {
        className,
        section,
        subject,
        roomNumber,
        classTeacher: classTeacher || null,
        academicYear,
        description,
        status,
      },
      { new: true, runValidators: true }
    );
    if (!classItem) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }
    return res.status(200).json({ success: true, message: "Class updated successfully", class: classItem });
  } catch (error) {
    console.error("Update class error:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: errors.join(", "), errors });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: `Invalid ${error.path}: ${error.value}` });
    }
    return res.status(500).json({ success: false, message: "Failed to update class", error: error.message });
  }
};

const deleteClass = async (req, res) => {
  try {
    const classItem = await Class.findByIdAndDelete(req.params.id);
    if (!classItem) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }
    return res.status(200).json({ success: true, message: "Class deleted successfully" });
  } catch (error) {
    console.error("Delete class error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete class", error: error.message });
  }
};

module.exports = { getClasses, getClassesByTeacherUser, createClass, updateClass, deleteClass };
