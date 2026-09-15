const Subject = require("../models/Subject");

const defaultSubjects = [
  ["ENG", "English"],
  ["TAM", "Tamil"],
  ["HIN", "Hindi"],
  ["MAT", "Mathematics"],
  ["SCI", "Science"],
  ["SOC", "Social Science"],
  ["PHY", "Physics"],
  ["CHE", "Chemistry"],
  ["BIO", "Biology"],
  ["CSC", "Computer Science"],
  ["IT", "Information Technology"],
  ["COM", "Commerce"],
  ["ACC", "Accountancy"],
  ["BST", "Business Studies"],
  ["ECO", "Economics"],
  ["PED", "Physical Education"],
  ["GK", "General Knowledge"],
  ["EVS", "Environmental Science"],
];

const seedDefaultSubjects = async () => {
  const count = await Subject.countDocuments();
  if (count > 0) return;

  await Subject.bulkWrite(
    defaultSubjects.map(([subjectCode, subjectName]) => ({
      updateOne: {
        filter: { subjectCode },
        update: {
          $setOnInsert: {
            subjectCode,
            subjectName,
            department: "",
            assignedTeacher: "",
            credits: 0,
            description: "",
            status: "active",
          },
        },
        upsert: true,
      },
    }))
  );
};

const getSubjects = async (req, res) => {
  try {
    await seedDefaultSubjects();
    const subjects = await Subject.find()
      .populate("teacher", "fullName employeeId")
      .populate("class", "className section")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: subjects.length, subjects });
  } catch (error) {
    console.error("Get subjects error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch subjects", error: error.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    return res.status(201).json({ success: true, message: "Subject added successfully", subject });
  } catch (error) {
    console.error("Create subject error:", error);
    return res.status(500).json({ success: false, message: "Failed to add subject", error: error.message });
  }
};

const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }
    return res.status(200).json({ success: true, message: "Subject updated successfully", subject });
  } catch (error) {
    console.error("Update subject error:", error);
    return res.status(500).json({ success: false, message: "Failed to update subject", error: error.message });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }
    return res.status(200).json({ success: true, message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Delete subject error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete subject", error: error.message });
  }
};

module.exports = { getSubjects, createSubject, updateSubject, deleteSubject };
