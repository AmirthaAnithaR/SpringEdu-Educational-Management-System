const express = require("express");
const router = express.Router();
const { getClasses, getClassesByTeacherUser, createClass, updateClass, deleteClass } = require("../controllers/classController");

router.get("/teacher/:userId", getClassesByTeacherUser);
router.get("/", getClasses);
router.post("/", createClass);
router.put("/:id", updateClass);
router.delete("/:id", deleteClass);

module.exports = router;
