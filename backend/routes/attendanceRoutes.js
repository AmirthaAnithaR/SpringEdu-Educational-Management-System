const express = require("express");
const router = express.Router();
const {
  getAttendance,
  getAttendanceHistory,
  getAttendanceDetails,
  saveAttendance,
  updateAttendance,
  deleteAttendance,
} = require("../controllers/attendanceController");

router.get("/", getAttendance);
router.get("/history/:teacherId", getAttendanceHistory);
router.get("/:attendanceId", getAttendanceDetails);
router.post("/", saveAttendance);
router.put("/:id", updateAttendance);
router.delete("/:id", deleteAttendance);

module.exports = router;
