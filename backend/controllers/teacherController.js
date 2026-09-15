const Teacher = require("../models/Teacher");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const Class = require("../models/Class");

const createTeacher = async (req, res) => {
  try {
    const {
      name,
      email,
      username,
      password,
      teacherId,
      gender,
      dateOfBirth,
      bloodGroup,
      photo,
      department,
      subject,
      assignedClass,
      qualification,
      experience,
      joiningDate,
      phone,
      address,
      status,
    } = req.body;

    if (
      !name ||
      !email ||
      !username ||
      !password ||
      !teacherId ||
      !gender ||
      !subject ||
      !qualification ||
      !phone
    ) {
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

    const existingTeacher = await Teacher.findOne({
      employeeId: teacherId,
    });

    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
      role: "teacher",
    });

    const teacher = await Teacher.create({
      user: user._id,
      employeeId: teacherId,
      fullName: name,
      gender,
      department: department || "",
      subject,
      assignedClass: assignedClass || "",
      qualification,
      experience: experience || 0,
      phone,
      address: address || "",
      status: status || "active",
      photo: photo || "",
      joiningDate: joiningDate || null,
      bloodGroup: bloodGroup || "",
      dateOfBirth: dateOfBirth || null,
    });

    return res.status(201).json({
      success: true,
      message: "Teacher added successfully",
      teacher,
    });

  } catch (error) {
    console.error("Create teacher error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add teacher",
      error: error.message,
    });
  }
};

const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate("user", "name email username role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: teachers.length,
      teachers,
    });

  } catch (error) {
    console.error("Get teachers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch teachers",
      error: error.message,
    });
  }
};

const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate("user", "name email username role");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    return res.status(200).json({
      success: true,
      teacher,
    });

  } catch (error) {
    console.error("Get teacher error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch teacher",
      error: error.message,
    });
  }
};

const getTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.params.userId }).populate("user", "name email username");
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
    return res.status(200).json({ success: true, teacher });
  } catch (error) {
    console.error("Get teacher profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch profile", error: error.message });
  }
};

const updateTeacherProfile = async (req, res) => {
  try {
    const { phone, address, photo } = req.body;
    const teacher = await Teacher.findOneAndUpdate(
      { user: req.params.userId },
      { phone: phone || "", address: address || "", photo: photo || "" },
      { new: true }
    ).populate("user", "name email username");
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
    return res.status(200).json({ success: true, message: "Profile updated successfully", teacher });
  } catch (error) {
    console.error("Update teacher profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile", error: error.message });
  }
};

const changeTeacherPassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    const teacher = await Teacher.findOne({ user: userId });
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
    const user = await User.findById(teacher.user);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid current password" });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change teacher password error:", error);
    return res.status(500).json({ success: false, message: "Failed to change password", error: error.message });
  }
};

const updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
    return res.status(200).json({ success: true, message: "Teacher updated successfully", teacher });
  } catch (error) {
    console.error("Update teacher error:", error);
    return res.status(500).json({ success: false, message: "Failed to update teacher", error: error.message });
  }
};

const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    await Teacher.findByIdAndDelete(req.params.id);

    await User.findByIdAndDelete(teacher.user);

    return res.status(200).json({
      success: true,
      message: "Teacher deleted successfully",
    });

  } catch (error) {
    console.error("Delete teacher error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete teacher",
      error: error.message,
    });
  }
};

/* ===========================
   Teacher Dashboard API
=========================== */

const getTeacherDashboard = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findOne({ user: id }).populate(
      "user",
      "name email username"
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const classes = await Class.find({ classTeacher: teacher._id });
    const totalClasses = classes.length;

    let totalStudents = 0;
    if (classes.length > 0) {
      const classQueries = classes.map(c => ({ className: c.className, section: c.section }));
      totalStudents = await Student.countDocuments({
        $or: classQueries
      });
    }

    const totalSubjects = await Subject.countDocuments({ teacher: teacher._id });

    // Today's attendance counts marked by this teacher
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    const todayAttendance = await Attendance.find({
      teacher: teacher._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    const presentToday = todayAttendance.filter((r) => r.status === "Present").length;
    const absentToday = todayAttendance.filter((r) => r.status === "Absent").length;
    const lateToday = todayAttendance.filter((r) => r.status === "Late").length;

    // Historical attendance rate
    const allTeacherAttendance = await Attendance.find({ teacher: teacher._id });
    const totalRecords = allTeacherAttendance.length;
    const presentRecords = allTeacherAttendance.filter(r => r.status === "Present").length;
    const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 100;

    res.status(200).json({
      success: true,
      dashboard: {
        teacherName: teacher.fullName,
        subject: teacher.subject,
        assignedClass: teacher.assignedClass,
        totalStudents,
        totalSubjects: totalSubjects || (teacher.subject ? 1 : 0),
        totalClasses,
        attendanceRate,
        todayAttendance: {
          present: presentToday,
          absent: absentToday,
          late: lateToday,
        },
      },
    });

  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};

const getMyClasses = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const classes = await Class.find({
      classTeacher: teacherId,
      status: "active",
    })
      .populate("classTeacher", "fullName employeeId")
      .sort({ className: 1, section: 1 });

    res.status(200).json({
      success: true,
      count: classes.length,
      classes,
    });
  } catch (error) {
    console.error("Get My Classes Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch classes",
      error: error.message,
    });
  }
};

module.exports = {
  createTeacher,
  getTeachers,
  getTeacherById,
  getTeacherProfile,
  updateTeacherProfile,
  changeTeacherPassword,
  updateTeacher,
  getMyClasses,
  deleteTeacher,
  getTeacherDashboard,
};
