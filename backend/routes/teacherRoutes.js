const express = require("express");
const router = express.Router();

const {
  createTeacher,
  getTeachers,
  getTeacherById,
  getTeacherProfile,
  updateTeacherProfile,
  changeTeacherPassword,
  updateTeacher,
  deleteTeacher,
  getTeacherDashboard,
  getMyClasses,
} = require("../controllers/teacherController");

// Dashboard
router.get("/dashboard/:id", getTeacherDashboard);
router.get("/profile/:userId", getTeacherProfile);
router.put("/profile/:userId", updateTeacherProfile);
router.put("/change-password", changeTeacherPassword);

// Teacher Classes (IMPORTANT: Place before /:id)
router.get("/:teacherId/classes", getMyClasses);

// CRUD
router.post("/", createTeacher);
router.get("/", getTeachers);
router.get("/:id", getTeacherById);
router.put("/:id", updateTeacher);
router.delete("/:id", deleteTeacher);

module.exports = router;
