const express = require("express");
const router = express.Router();
const { getNotices, getNoticeById, createNotice, updateNotice, deleteNotice } = require("../controllers/noticeController");

router.get("/", getNotices);
router.get("/:id", getNoticeById);
router.post("/", createNotice);
router.put("/:id", updateNotice);
router.delete("/:id", deleteNotice);

module.exports = router;
