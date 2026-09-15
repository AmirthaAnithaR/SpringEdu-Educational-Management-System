const Attendance = require("../models/Attendance");
const Class = require("../models/Class");
const Student = require("../models/Student");

const mapStudentToClassClassName = (className) => {
  if (!className) return "";
  if (/^\d+$/.test(className)) {
    return `Grade ${className}`;
  }
  return className;
};

const getDateRange = (date) => {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
};

const getAttendance = async (req, res) => {
  try {
    const query = {};
    if (req.query.date) {
      query.date = getDateRange(req.query.date);
    }
    if (req.query.student) query.student = req.query.student;
    if (req.query.class) query.class = req.query.class;
    if (req.query.subject) query.subject = req.query.subject;

    const attendance = await Attendance.find(query)
      .populate("student", "name rollNumber className section")
      .populate("class", "className section")
      .sort({ date: -1, createdAt: -1 });
    return res.status(200).json({ success: true, count: attendance.length, attendance });
  } catch (error) {
    console.error("Get attendance error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch attendance", error: error.message });
  }
};

const getAttendanceHistory = async (req, res) => {
  try {
    const query = { teacher: req.params.teacherId };

    if (req.query.classId) query.class = req.query.classId;
    if (req.query.date) query.date = getDateRange(req.query.date);

    const records = await Attendance.find(query)
      .populate("student", "name rollNumber")
      .populate("class", "className section subject academicYear")
      .sort({ date: -1, createdAt: -1 });

    const grouped = records.reduce((acc, record) => {
      const dateKey = record.date.toISOString().slice(0, 10);
      const classId = record.class?._id?.toString() || "unknown";
      const subjectName = record.subject || record.class?.subject || "";
      const key = `${dateKey}-${classId}-${subjectName}`;

      if (!acc[key]) {
        acc[key] = {
          _id: record._id,
          date: dateKey,
          class: record.class,
          subject: subjectName,
          students: 0,
          present: 0,
          absent: 0,
          late: 0,
        };
      }

      acc[key].students += 1;
      if (record.status === "Present") acc[key].present += 1;
      if (record.status === "Absent") acc[key].absent += 1;
      if (record.status === "Late") acc[key].late += 1;

      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      count: Object.keys(grouped).length,
      history: Object.values(grouped),
    });
  } catch (error) {
    console.error("Get attendance history error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch attendance history", error: error.message });
  }
};

const getAttendanceDetails = async (req, res) => {
  try {
    const seed = await Attendance.findById(req.params.attendanceId);

    if (!seed) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    const records = await Attendance.find({
      teacher: seed.teacher,
      class: seed.class,
      subject: seed.subject,
      date: seed.date,
    })
      .populate("teacher", "fullName employeeId")
      .populate("class", "className section subject academicYear")
      .populate("student", "name rollNumber");

    records.sort((a, b) => (a.student?.name || "").localeCompare(b.student?.name || ""));

    const firstRecord = records[0];

    return res.status(200).json({
      success: true,
      attendance: {
        _id: seed._id,
        teacher: firstRecord?.teacher,
        class: firstRecord?.class,
        subject: seed.subject || firstRecord?.class?.subject || "",
        academicYear: firstRecord?.class?.academicYear || "",
        date: seed.date.toISOString().slice(0, 10),
        students: records.map((record) => ({
          _id: record.student?._id,
          name: record.student?.name,
          rollNumber: record.student?.rollNumber,
          status: record.status,
        })),
      },
    });
  } catch (error) {
    console.error("Get attendance details error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch attendance details", error: error.message });
  }
};

const saveAttendance = async (req, res) => {
  try {
    // 1. Support Admin format: { records: [ { student, date, status, remarks } ] }
    if (req.body.records && Array.isArray(req.body.records)) {
      const { records } = req.body;
      const bulkOps = [];

      for (const record of records) {
        if (!record.student || !record.date || !record.status) continue;

        const studentId = record.student;
        const status = record.status;
        const normalizedDate = new Date(record.date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        // Fetch Student to determine className and section
        const studentObj = await Student.findById(studentId);
        if (!studentObj) continue;

        // Resolve Class matching className and section
        const classObj = await Class.findOne({
          className: mapStudentToClassClassName(studentObj.className),
          section: studentObj.section,
        });

        if (!classObj) continue;

        bulkOps.push({
          updateOne: {
            filter: {
              student: studentId,
              class: classObj._id,
              subject: classObj.subject,
              date: normalizedDate,
            },
            update: {
              $set: {
                status,
                teacher: classObj.classTeacher || undefined,
              },
            },
            upsert: true,
          },
        });
      }

      if (bulkOps.length > 0) {
        await Attendance.bulkWrite(bulkOps);
      }

      return res.status(200).json({
        success: true,
        message: "Attendance saved successfully.",
      });
    }

    // 2. Support Teacher format: { teacherId, classId, date, attendance: [ { studentId, status } ] }
    const { teacherId, classId, date, attendance } = req.body;

    if (!teacherId || !classId || !date || !Array.isArray(attendance) || attendance.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Teacher, class, date, and attendance records are required.",
      });
    }

    // Fetch Class to resolve the subject name
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    const subject = classObj.subject;
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const bulkOps = attendance.map((record) => ({
      updateOne: {
        filter: {
          student: record.studentId,
          class: classId,
          subject: subject,
          date: normalizedDate,
        },
        update: {
          $set: {
            teacher: teacherId,
            status: record.status,
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(bulkOps);

    return res.status(200).json({
      success: true,
      message: "Attendance saved successfully.",
    });
  } catch (error) {
    console.error("Save attendance error:", error);
    return res.status(500).json({ success: false, message: "Failed to save attendance", error: error.message });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!attendance) return res.status(404).json({ success: false, message: "Attendance record not found" });
    return res.status(200).json({ success: true, message: "Attendance updated successfully", attendance });
  } catch (error) {
    console.error("Update attendance error:", error);
    return res.status(500).json({ success: false, message: "Failed to update attendance", error: error.message });
  }
};

const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) return res.status(404).json({ success: false, message: "Attendance record not found" });
    return res.status(200).json({ success: true, message: "Attendance deleted successfully" });
  } catch (error) {
    console.error("Delete attendance error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete attendance", error: error.message });
  }
};

module.exports = { getAttendance, getAttendanceHistory, getAttendanceDetails, saveAttendance, updateAttendance, deleteAttendance };

