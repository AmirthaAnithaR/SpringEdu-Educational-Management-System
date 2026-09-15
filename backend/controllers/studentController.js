const Student = require("../models/Student");
const User = require("../models/User");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const Notice = require("../models/Notices");
const Marks = require("../models/Marks");
const bcrypt = require("bcryptjs");

const addStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      username,
      password,
      admissionNumber,
      rollNumber,
      gender,
      dateOfBirth,
      className,
      section,
      academicYear,
      parentName,
      parentPhone,
      address,
      bloodGroup,
      phone,
      fatherName,
      motherName,
      profileImage,
      status,
    } = req.body;

    if (!name || !email || !username || !password || !admissionNumber) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email or Username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
      role: "student",
    });

    const student = await Student.create({
      user: user._id,
      admissionNumber,
      rollNumber,
      name,
      gender,
      dateOfBirth,
      className,
      section,
      phone: phone || "",
      fatherName: fatherName || parentName || "",
      motherName: motherName || "",
      parentPhone: parentPhone || "",
      address: address || "",
      bloodGroup: bloodGroup || "",
      profileImage: profileImage || "",
      status: status || "Active",
      academicYear: academicYear || "",
    });

    return res.status(201).json({
      success: true,
      message: "Student added successfully",
      student,
    });
  } catch (error) {
    console.error("Add student error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add student",
      error: error.message,
    });
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("user", "name email username role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Get students error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch students",
      error: error.message,
    });
  }
};

const getStudentsByClass = async (req, res) => {
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

    const formattedStudents = students.map((student) => ({
      _id: student._id,
      studentId: student.admissionNumber,
      fullName: student.name,
      gender: student.gender,
      rollNumber: student.rollNumber,
      photo: student.profileImage,
    }));

    return res.status(200).json({
      success: true,
      count: formattedStudents.length,
      students: formattedStudents,
    });
  } catch (error) {
    console.error("Get students by class error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch class students", error: error.message });
  }
};

const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate("user", "name email username role");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    return res.status(200).json({ success: true, student });
  } catch (error) {
    console.error("Get student error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch student", error: error.message });
  }
};

const getStudentDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.params.userId }).populate("user", "name email username role");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const classItem = await Class.findOne({
      className: student.className,
      section: student.section,
    });

    const classNoticeQuery = classItem
      ? { status: "Published", $or: [{ audience: "All" }, { audience: "Students" }, { audience: "Classes", class: classItem._id }] }
      : { status: "Published", audience: { $in: ["All", "Students"] } };

    const examNoticeQuery = {
      ...classNoticeQuery,
      category: "Exam",
      $and: [{ $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gte: new Date() } }] }],
    };

    const [subjectCount, attendanceRecords, recentAttendance, noticesCount, recentNotices, upcomingExamNotices, totalResults] = await Promise.all([
      classItem ? Subject.countDocuments({ class: classItem._id, status: "active" }) : 0,
      Attendance.find({ student: student._id }).select("status date"),
      Attendance.find({ student: student._id }).select("status date").sort({ date: -1 }).limit(5),
      Notice.countDocuments(classNoticeQuery),
      Notice.find(classNoticeQuery).select("title publishDate createdAt category priority").sort({ publishDate: -1, createdAt: -1 }).limit(5),
      Notice.find(examNoticeQuery).populate("class", "subject").select("title publishDate expiryDate class").sort({ publishDate: 1, createdAt: 1 }).limit(5),
      Marks.countDocuments({ student: student._id }),
    ]);

    const presentDays = attendanceRecords.filter((item) => item.status === "Present").length;
    const absentDays = attendanceRecords.filter((item) => item.status === "Absent").length;
    const lateDays = attendanceRecords.filter((item) => item.status === "Late").length;
    const attendancePercentage = attendanceRecords.length > 0 ? Math.round((presentDays / attendanceRecords.length) * 100) : 0;
    const totalSubjects = subjectCount || (classItem?.subject ? 1 : 0);

    return res.status(200).json({
      success: true,
      student: {
        fullName: student.name,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        class: student.className,
        section: student.section,
        academicYear: classItem?.academicYear || "",
        profilePhoto: student.profileImage || "",
      },
      stats: {
        totalSubjects,
        attendancePercentage,
        totalPresentDays: presentDays,
        totalAbsentDays: absentDays,
        totalLateDays: lateDays,
        noticesCount,
        upcomingExamsCount: upcomingExamNotices.length,
        totalResults,
      },
      recentAttendance: recentAttendance.map((item) => ({ _id: item._id, date: item.date, status: item.status })),
      recentNotices: recentNotices.map((notice) => ({ _id: notice._id, title: notice.title, date: notice.publishDate || notice.createdAt })),
      upcomingExams: upcomingExamNotices.map((notice) => ({
        _id: notice._id,
        subject: notice.class?.subject || classItem?.subject || "Exam",
        examType: notice.title,
        examDate: notice.publishDate || notice.expiryDate,
      })),
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    return res.status(500).json({ success: false, message: "Failed to load student dashboard", error: error.message });
  }
};

const getStudentSubjects = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.params.userId });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const classItem = await Class.findOne({
      className: student.className,
      section: student.section,
    });

    if (!classItem) {
      return res.status(200).json({
        success: true,
        count: 0,
        academicYear: "",
        class: student.className,
        section: student.section,
        subjects: [],
      });
    }

    const subjects = await Subject.find({ class: classItem._id })
      .populate("teacher", "fullName employeeId")
      .populate("class", "className section academicYear")
      .sort({ subjectName: 1 });

    const formattedSubjects = subjects.map((subject) => ({
      _id: subject._id,
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode || "",
      teacherName: subject.teacher?.fullName || subject.assignedTeacher || "Not Assigned",
      teacherEmployeeId: subject.teacher?.employeeId || "",
      department: subject.department || "",
      academicYear: subject.class?.academicYear || classItem.academicYear || "",
      class: subject.class?.className || classItem.className,
      section: subject.class?.section || classItem.section,
      status: subject.status || "active",
    }));

    return res.status(200).json({
      success: true,
      count: formattedSubjects.length,
      academicYear: classItem.academicYear || "",
      class: classItem.className,
      section: classItem.section,
      subjects: formattedSubjects,
    });
  } catch (error) {
    console.error("Student subjects error:", error);
    return res.status(500).json({ success: false, message: "Failed to load student subjects", error: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const {
      name,
      email,
      username,
      admissionNumber,
      rollNumber,
      gender,
      dateOfBirth,
      className,
      section,
      parentName,
      parentPhone,
      address,
      bloodGroup,
      phone,
      fatherName,
      motherName,
      profileImage,
      status,
    } = req.body;

    if (!name || !email || !username || !admissionNumber || !rollNumber || !gender || !dateOfBirth || !className || !section || !parentPhone || !address) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const duplicateUser = await User.findOne({
      _id: { $ne: student.user },
      $or: [{ email }, { username }],
    });

    if (duplicateUser) {
      return res.status(400).json({
        success: false,
        message: "Email or Username already exists",
      });
    }

    const duplicateStudent = await Student.findOne({
      _id: { $ne: student._id },
      $or: [{ admissionNumber }, { rollNumber }],
    });

    if (duplicateStudent) {
      return res.status(400).json({
        success: false,
        message: "Admission Number or Roll Number already exists",
      });
    }

    if (student.user && (name || email || username)) {
      await User.findByIdAndUpdate(student.user, {
        name,
        email,
        username,
      });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        admissionNumber,
        rollNumber,
        name,
        gender,
        dateOfBirth,
        className,
        section,
        phone: phone || "",
        fatherName: fatherName || parentName || "",
        motherName: motherName || "",
        parentPhone: parentPhone || "",
        address: address || "",
        bloodGroup: bloodGroup || "",
        profileImage: profileImage || "",
        status: status || "Active",
      },
      { new: true, runValidators: true }
    ).populate("user", "name email username role");

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Update student error:", error);
    return res.status(500).json({ success: false, message: "Failed to update student", error: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    await Student.findByIdAndDelete(req.params.id);
    if (student.user) {
      await User.findByIdAndDelete(student.user);
    }

    return res.status(200).json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    console.error("Delete student error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete student", error: error.message });
  }
};


const getStudentAttendanceAPI = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.params.userId }).populate("user", "name email");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const attendanceRecords = await Attendance.find({ student: student._id })
      .populate("class", "className section subject academicYear")
      .populate("teacher", "fullName employeeId")
      .sort({ date: -1 });

    const totalWorkingDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((r) => r.status === "Present").length;
    const absentDays = attendanceRecords.filter((r) => r.status === "Absent").length;
    const lateDays = attendanceRecords.filter((r) => r.status === "Late").length;
    const attendancePercentage = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0;

    return res.status(200).json({
      success: true,
      student: {
        fullName: student.name,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        class: student.className,
        section: student.section,
      },
      summary: {
        totalWorkingDays,
        presentDays,
        absentDays,
        lateDays,
        attendancePercentage,
      },
      records: attendanceRecords.map((r) => ({
        _id: r._id,
        date: r.date,
        status: r.status,
        subject: r.class?.subject || "General",
        teacher: r.teacher?.fullName || "Class Teacher",
      })),
    });
  } catch (error) {
    console.error("Get student attendance API error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch attendance data", error: error.message });
  }
};

const getStudentResultsAPI = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.params.userId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const marksRecords = await Marks.find({ student: student._id })
      .populate("teacher", "fullName employeeId")
      .populate("class", "className section academicYear")
      .sort({ createdAt: -1 });

    let overallPercentage = 0;
    let cgpa = null;

    if (marksRecords.length > 0) {
      const totalPct = marksRecords.reduce((sum, m) => {
        const pct = m.maximumMarks > 0 ? (m.marksObtained / m.maximumMarks) * 100 : 0;
        return sum + pct;
      }, 0);
      overallPercentage = Math.round(totalPct / marksRecords.length);

      const gradePoints = { "A+": 10, "A": 9, "B+": 8, "B": 7, "C": 6, "D": 5, "F": 0 };
      let totalPoints = 0;
      let gradedCount = 0;

      marksRecords.forEach((m) => {
        const gp = gradePoints[m.grade];
        if (gp !== undefined) {
          totalPoints += gp;
          gradedCount++;
        }
      });
      cgpa = gradedCount > 0 ? (totalPoints / gradedCount).toFixed(2) : null;
    }

    return res.status(200).json({
      success: true,
      records: marksRecords.map((m) => ({
        _id: m._id,
        examType: m.examType,
        subject: m.subject,
        marksObtained: m.marksObtained,
        maximumMarks: m.maximumMarks,
        grade: m.grade,
        remarks: m.remarks,
        percentage: m.maximumMarks > 0 ? ((m.marksObtained / m.maximumMarks) * 100).toFixed(1) : "0",
        academicYear: m.academicYear || m.class?.academicYear || "",
      })),
      overallPercentage,
      cgpa,
    });
  } catch (error) {
    console.error("Get student results API error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch student results", error: error.message });
  }
};

const getStudentNoticesAPI = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.params.userId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const classItem = await Class.findOne({
      className: student.className,
      section: student.section,
    });

    const classNoticeQuery = classItem
      ? { status: "Published", $or: [{ audience: "All" }, { audience: "Students" }, { audience: "Classes", class: classItem._id }] }
      : { status: "Published", audience: { $in: ["All", "Students"] } };

    const notices = await Notice.find(classNoticeQuery).sort({ publishDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      notices: notices.map((n) => ({
        _id: n._id,
        title: n.title,
        message: n.message,
        category: n.category || "General",
        priority: n.priority || "Medium",
        publishDate: n.publishDate || n.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get student notices API error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch notices", error: error.message });
  }
};

const getStudentProfileAPI = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.params.userId }).populate("user", "name email username");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const classItem = await Class.findOne({
      className: student.className,
      section: student.section,
    });

    return res.status(200).json({
      success: true,
      student: {
        _id: student._id,
        user: student.user,
        fullName: student.name,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        class: student.className,
        section: student.section,
        academicYear: classItem?.academicYear || "N/A",
        email: student.user?.email || "",
        phone: student.phone || "",
        address: student.address || "",
        gender: student.gender || "Other",
        bloodGroup: student.bloodGroup || "",
        dateOfBirth: student.dateOfBirth,
        parentName: student.fatherName || student.motherName || "",
        parentPhone: student.parentPhone || "",
        profilePhoto: student.profileImage || "",
      },
    });
  } catch (error) {
    console.error("Get student profile API error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch student profile", error: error.message });
  }
};

const updateStudentProfileAPI = async (req, res) => {
  try {
    const { phone, address, profilePhoto } = req.body;

    const student = await Student.findOneAndUpdate(
      { user: req.params.userId },
      {
        phone: phone || "",
        address: address || "",
        profileImage: profilePhoto || "",
      },
      { new: true, runValidators: true }
    ).populate("user", "name email username");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      student: {
        _id: student._id,
        user: student.user,
        fullName: student.name,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        class: student.className,
        section: student.section,
        phone: student.phone || "",
        address: student.address || "",
        profilePhoto: student.profileImage || "",
      }
    });
  } catch (error) {
    console.error("Update student profile API error:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile", error: error.message });
  }
};

const changeStudentPasswordAPI = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const user = await User.findById(student.user);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid current password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change student password API error:", error);
    return res.status(500).json({ success: false, message: "Failed to change password", error: error.message });
  }
};

module.exports = {
  addStudent,
  getStudents,
  getStudentsByClass,
  getStudentDashboard,
  getStudentSubjects,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentAttendanceAPI,
  getStudentResultsAPI,
  getStudentNoticesAPI,
  getStudentProfileAPI,
  updateStudentProfileAPI,
  changeStudentPasswordAPI,
};

