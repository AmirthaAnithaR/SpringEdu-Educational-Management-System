const express = require("express");
const router = express.Router();
const {
  getStudentsByMarksClass,
  saveMarks,
  updateMarks,
  getStudentMarks,
} = require("../controllers/marksController");

router.get("/class/:classId", getStudentsByMarksClass);
router.post("/", saveMarks);
router.put("/:id", updateMarks);
router.get("/student/:studentId", getStudentMarks);

module.exports = router;
