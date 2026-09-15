const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const Notice = require("../models/Notices");
const Attendance = require("../models/Attendance");

const getDashboardStats = async (req, res) => {
  try {
        const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const [students, teachers, classes, subjects, notices, presentToday, recentStudents, recentTeachers, recentNotices] =
      await Promise.all([
        Student.countDocuments(),
        Teacher.countDocuments(),
        Class.countDocuments(),
        Subject.countDocuments(),
        Notice.countDocuments(),
        Attendance.countDocuments({ status: "Present", date: { $gte: today, $lt: tomorrow } }),
        Student.find().sort({ createdAt: -1 }).limit(5),
        Teacher.find().sort({ createdAt: -1 }).limit(5),
        Notice.find().sort({ createdAt: -1 }).limit(5),
      ]);

    const studentsByClass = await Student.aggregate([{ $group: { _id: "$className", count: { $sum: 1 } } }]);
    const studentsByGender = await Student.aggregate([{ $group: { _id: "$gender", count: { $sum: 1 } } }]);
    const attendanceOverview = await Attendance.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);

    return res.status(200).json({
      success: true,
      stats: { students, teachers, classes, subjects, notices, presentToday },
      recentStudents,
      recentTeachers,
      recentNotices,
      charts: { studentsByClass, studentsByGender, attendanceOverview },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch dashboard stats", error: error.message });
  }
};

module.exports = { getDashboardStats };
