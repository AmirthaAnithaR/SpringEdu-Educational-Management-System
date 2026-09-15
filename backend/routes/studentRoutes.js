const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/studentController");

// Add Student
router.post("/", addStudent);

// Get All Students
router.get("/", getStudents);

// Get Students By Class
router.get("/class/:classId", getStudentsByClass);

// Student Dashboard
router.get("/dashboard/:userId", getStudentDashboard);

// Student Subjects
router.get("/subjects/:userId", getStudentSubjects);

// Student Attendance API
router.get("/attendance/:userId", getStudentAttendanceAPI);

// Student Results API
router.get("/results/:userId", getStudentResultsAPI);

// Student Notices API
router.get("/notices/:userId", getStudentNoticesAPI);

// Student Profile APIs
router.get("/profile/:userId", getStudentProfileAPI);
router.put("/profile/:userId", updateStudentProfileAPI);
router.put("/change-password", changeStudentPasswordAPI);

// Get, Update, Delete Student
router.get("/:id", getStudentById);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

// Test Route
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Student Routes Working Successfully!",
  });
});

module.exports = router;
