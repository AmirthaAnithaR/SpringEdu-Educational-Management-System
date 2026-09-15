const Notice = require("../models/Notices");
const Class = require("../models/Class");
const Teacher = require("../models/Teacher");
const User = require("../models/User");

const canCreateTeacherNotice = (user) => user?.role === "teacher";

const normalizeNoticePayload = (body) => ({
  ...body,
  title: body.title,
  description: body.description,
  category: body.category || "General",
  audience: body.audience || "All",
  class: body.class?._id || body.class || body.classId || null,
  priority: body.priority || "Medium",
  publishDate: body.publishDate || Date.now(),
  expiryDate: body.expiryDate || null,
  attachment: body.attachment || body.attachmentUrl || "",
  attachmentUrl: body.attachmentUrl || body.attachment || "",
  status: body.status || "Draft",
});

const validateNotice = ({ title, description, publishDate, expiryDate }) => {
  if (!title || !title.trim()) return "Title is required.";
  if (!description || !description.trim()) return "Description is required.";
  if (publishDate && expiryDate && new Date(publishDate) > new Date(expiryDate)) {
    return "Publish Date cannot be after Expiry Date.";
  }
  return "";
};

const getNotices = async (req, res) => {
  try {
    const { userId, role } = req.query;
    const query = {};

    if (role === "teacher" && userId) {
      const teacher = await Teacher.findOne({ user: userId });
      const assignedClassIds = teacher
        ? (await Class.find({ classTeacher: teacher._id }).select("_id")).map((item) => item._id)
        : [];

      query.$or = [
        { status: "Published", audience: "All" },
        { status: "Published", audience: "Teachers" },
        { status: "Published", audience: "Classes", class: { $in: assignedClassIds } },
        { createdBy: userId },
      ];
    } else if (req.query.audience) {
      query.audience = { $in: [req.query.audience, "All"] };
    }

    const notices = await Notice.find(query)
      .populate("publishedBy", "name role")
      .populate("createdBy", "name role")
      .populate("class", "className section")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: notices.length, notices });
  } catch (error) {
    console.error("Get notices error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch notices", error: error.message });
  }
};

const getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate("publishedBy", "name role")
      .populate("createdBy", "name role")
      .populate("class", "className section subject academicYear");

    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
    return res.status(200).json({ success: true, notice });
  } catch (error) {
    console.error("Get notice details error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch notice", error: error.message });
  }
};

const createNotice = async (req, res) => {
  try {
    const payload = normalizeNoticePayload(req.body);
    const validationError = validateNotice(payload);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    if (req.body.createdBy) {
      const user = await User.findById(req.body.createdBy);
      if (!canCreateTeacherNotice(user) && user?.role !== "admin") {
        return res.status(403).json({ success: false, message: "You do not have permission to create notices." });
      }
      payload.createdBy = user._id;
      payload.publishedBy = user._id;
      payload.createdByName = user.name;
    } else if (req.body.createdByName) {
      payload.createdByName = req.body.createdByName;
    }

    const notice = await Notice.create(payload);
    return res.status(201).json({ success: true, message: "Notice saved successfully", notice });
  } catch (error) {
    console.error("Create notice error:", error);
    return res.status(500).json({ success: false, message: "Failed to save notice", error: error.message });
  }
};

const updateNotice = async (req, res) => {
  try {
    const existing = await Notice.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Notice not found" });

    if (req.body.userId && existing.createdBy?.toString() !== req.body.userId) {
      return res.status(403).json({ success: false, message: "You can edit only notices created by you." });
    }

    const payload = normalizeNoticePayload({ ...existing.toObject(), ...req.body });
    const validationError = validateNotice(payload);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const notice = await Notice.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
    return res.status(200).json({ success: true, message: "Notice updated successfully", notice });
  } catch (error) {
    console.error("Update notice error:", error);
    return res.status(500).json({ success: false, message: "Failed to update notice", error: error.message });
  }
};

const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });

    if (req.query.userId && notice.createdBy?.toString() !== req.query.userId) {
      return res.status(403).json({ success: false, message: "You can delete only notices created by you." });
    }

    await Notice.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Notice deleted successfully" });
  } catch (error) {
    console.error("Delete notice error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete notice", error: error.message });
  }
};

module.exports = { getNotices, getNoticeById, createNotice, updateNotice, deleteNotice };
