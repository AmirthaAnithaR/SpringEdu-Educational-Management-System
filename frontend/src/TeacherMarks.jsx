import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaBookOpen, FaCalendarAlt, FaInfoCircle, FaLayerGroup, FaSignal, FaUsers } from "react-icons/fa";
import "./TeacherDashboard.css";

const EXAM_TYPES = ["Unit Test 1", "Unit Test 2", "Mid Term", "Quarterly", "Half Yearly", "Model Exam", "Annual Exam"];
const PAGE_SIZE = 20;

const gradeRemarks = {
  "A+": "Excellent",
  A: "Very Good",
  "B+": "Good",
  B: "Average",
  C: "Needs Improvement",
  D: "Poor",
  F: "Fail",
};

function calculateGrade(marksObtained, maximumMarks) {
  const marks = Number(marksObtained);
  const max = Number(maximumMarks);
  if (Number.isNaN(marks) || Number.isNaN(max) || max <= 0) return { grade: "", remarks: "" };
  const percentage = (marks / max) * 100;
  if (percentage >= 90) return { grade: "A+", remarks: gradeRemarks["A+"] };
  if (percentage >= 80) return { grade: "A", remarks: gradeRemarks.A };
  if (percentage >= 70) return { grade: "B+", remarks: gradeRemarks["B+"] };
  if (percentage >= 60) return { grade: "B", remarks: gradeRemarks.B };
  if (percentage >= 50) return { grade: "C", remarks: gradeRemarks.C };
  if (percentage >= 40) return { grade: "D", remarks: gradeRemarks.D };
  return { grade: "F", remarks: gradeRemarks.F };
}

function TeacherMarks() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [form, setForm] = useState({ subject: "", academicYear: "", examType: "Unit Test 1" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [studentsError, setStudentsError] = useState("");
  const [message, setMessage] = useState("");

  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const pagedStudents = useMemo(() => students.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [students, page]);

  const getUserId = () => {
    const userVal = localStorage.getItem("user");
    const user = userVal ? JSON.parse(userVal) : null;
    return user?._id || user?.id || "";
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError("");
      const userId = getUserId();
      if (!userId) {
        setClasses([]);
        setError("Unable to find the logged-in teacher. Please log in again.");
        return;
      }
      const response = await axios.get(`/api/classes/teacher/${userId}`);
      setClasses(response.data.classes || []);
    } catch (err) {
      console.error("Error loading marks classes:", err);
      setError(err.response?.data?.message || "Unable to load your assigned classes right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const createBlankRecord = () => {
    const calculated = calculateGrade(0, 100);
    return { id: "", marksObtained: "0", maximumMarks: "100", grade: calculated.grade, remarks: calculated.remarks };
  };

  const createBlankMarks = (studentList) =>
    studentList.reduce((acc, student) => {
      acc[student._id] = createBlankRecord();
      return acc;
    }, {});

  const fetchStudents = async (classItem) => {
    try {
      setSelectedClass(classItem);
      setStudents([]);
      setMarks({});
      setMessage("");
      setStudentsError("");
      setStudentsLoading(true);
      setPage(1);
      setForm({
        subject: classItem.subject || "",
        academicYear: classItem.academicYear || "",
        examType: "Unit Test 1",
      });

      const response = await axios.get(`/api/marks/class/${classItem._id}`);
      const fetchedStudents = response.data.students || [];
      setStudents(fetchedStudents);
      setMarks(createBlankMarks(fetchedStudents));
    } catch (err) {
      console.error("Error loading marks students:", err);
      setStudentsError(err.response?.data?.message || "Unable to load students for this class.");
    } finally {
      setStudentsLoading(false);
    }
  };

  const loadExistingMarks = async () => {
    if (!selectedClass || students.length === 0 || !form.subject || !form.examType || !form.academicYear) return;

    try {
      setStudentsError("");
      const results = await Promise.all(students.map((student) => axios.get(`/api/marks/student/${student._id}`).catch(() => ({ data: { marks: [] } }))));
      const nextMarks = createBlankMarks(students);

      results.forEach((response, index) => {
        const student = students[index];
        const existing = (response.data.marks || []).find((item) => {
          const classId = item.class?._id || item.class;
          return classId === selectedClass._id && item.subject === form.subject && item.examType === form.examType && item.academicYear === form.academicYear;
        });

        if (existing) {
          nextMarks[student._id] = {
            id: existing._id,
            marksObtained: String(existing.marksObtained),
            maximumMarks: String(existing.maximumMarks || 100),
            grade: existing.grade || "",
            remarks: existing.remarks || "",
          };
        }
      });

      setMarks(nextMarks);
    } catch (err) {
      console.error("Error loading existing marks:", err);
      setStudentsError("Unable to load existing marks for this selection.");
    }
  };

  useEffect(() => {
    loadExistingMarks();
  }, [selectedClass?._id, students.length, form.subject, form.examType, form.academicYear]);



  const classFields = (cls) => [
    { icon: <FaLayerGroup />, label: "Section", value: cls.section || "N/A" },
    { icon: <FaBookOpen />, label: "Subject", value: cls.subject || "N/A" },
    { icon: <FaCalendarAlt />, label: "Academic Year", value: cls.academicYear || "N/A" },
    { icon: <FaUsers />, label: "Total Students", value: cls.totalStudents ?? 0 },
    { icon: <FaSignal />, label: "Status", value: cls.status ? cls.status.charAt(0).toUpperCase() + cls.status.slice(1) : "Inactive", status: cls.status },
  ];

  const updateMark = (studentId, field, value) => {
    setMessage("");
    setMarks((current) => {
      const previous = current[studentId] || createBlankRecord();
      const next = { ...previous, [field]: value };
      if (field === "marksObtained" || field === "maximumMarks") {
        const calculated = calculateGrade(next.marksObtained, next.maximumMarks);
        next.grade = calculated.grade;
        next.remarks = calculated.remarks;
      }
      return { ...current, [studentId]: next };
    });
  };

  const validateMarks = () => {
    if (!form.subject.trim() || !form.academicYear.trim() || !form.examType) return "Class, subject, academic year, and exam type are required.";
    const invalid = students.find((student) => {
      const record = marks[student._id] || {};
      const obtained = Number(record.marksObtained);
      const maximum = Number(record.maximumMarks);
      return Number.isNaN(obtained) || Number.isNaN(maximum) || obtained < 0 || maximum <= 0 || obtained > maximum;
    });
    return invalid ? "Marks cannot be negative or exceed Maximum Marks." : "";
  };

  const handleSaveMarks = async () => {
    const validationError = validateMarks();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      const existingRecords = students.filter((student) => marks[student._id]?.id);
      const newRecords = students.filter((student) => !marks[student._id]?.id);

      await Promise.all(
        existingRecords.map((student) => {
          const record = marks[student._id];
          return axios.put(`/api/marks/${record.id}`, {
            marksObtained: Number(record.marksObtained),
            maximumMarks: Number(record.maximumMarks),
            grade: record.grade,
            remarks: record.remarks,
          });
        })
      );

      if (newRecords.length > 0) {
        await axios.post("/api/marks", {
          teacherId: selectedClass.classTeacher?._id,
          classId: selectedClass._id,
          subject: form.subject.trim(),
          examType: form.examType,
          academicYear: form.academicYear.trim(),
          marks: newRecords.map((student) => ({
            studentId: student._id,
            marksObtained: Number(marks[student._id].marksObtained),
            maximumMarks: Number(marks[student._id].maximumMarks),
            grade: marks[student._id].grade,
            remarks: marks[student._id].remarks,
          })),
        });
      }

      setMessage("Marks saved successfully.");
      await loadExistingMarks();
    } catch (err) {
      console.error("Error saving marks:", err);
      setMessage(err.response?.data?.message || "Unable to save marks right now.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMarks(createBlankMarks(students));
    setMessage("");
  };

  const handleBack = () => {
    setSelectedClass(null);
    setStudents([]);
    setMarks({});
    setMessage("");
    setStudentsError("");
  };

  if (selectedClass) {
    return (
      <div className="teacher-dashboard-page">
        <style>{marksStyles}</style>
        <div className="teacher-dashboard-header">
          <h1>Marks Management</h1>
          <p>Class: <b>{selectedClass.className} - {selectedClass.section}</b></p>
        </div>

        <div className="marks-panel">
          <div className="marks-form-grid">
            <label>Class<input value={`${selectedClass.className || ""} - ${selectedClass.section || ""}`} readOnly /></label>
            <label>Subject<input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
            <label>Academic Year<input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} /></label>
            <label>Exam Type<select value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}>{EXAM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
          </div>

          <MarksTable
            students={pagedStudents}
            allStudents={students}
            marks={marks}
            updateMark={updateMark}
            loading={studentsLoading}
            error={studentsError}
            retry={() => fetchStudents(selectedClass)}
          />

          {students.length > PAGE_SIZE && (
            <div className="marks-pagination">
              <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}

          <div className="marks-actions">
            {message && <p className={message === "Marks saved successfully." ? "marks-success" : "marks-error"}>{message}</p>}
            <button type="button" className="marks-secondary-btn" onClick={handleBack}>Back</button>
            <button type="button" className="marks-secondary-btn" onClick={handleReset} disabled={saving || students.length === 0}>Reset</button>
            <button type="button" className="save-btn" onClick={handleSaveMarks} disabled={saving || studentsLoading || students.length === 0}>
              {saving ? "Saving..." : "Save Marks"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard-page teacher-classes-page">
      <div className="teacher-dashboard-header">
        <h1>Marks Management</h1>
      </div>

      {loading && <div className="teacher-classes-container">{[1, 2, 3].map((item) => <div key={item} className="class-card class-card-skeleton"><div className="skeleton-title" /><div className="skeleton-line" /><div className="skeleton-line" /><div className="skeleton-line" /><div className="skeleton-button" /></div>)}</div>}
      {!loading && error && <StateCard icon={<FaInfoCircle />} title="Could not load classes" message={error} action={fetchClasses} />}
      {!loading && !error && classes.length === 0 && <StateCard icon={<div className="empty-illustration">No</div>} title="No Classes Assigned" message="You have not been assigned any classes by the administrator yet." />}
      {!loading && !error && classes.length > 0 && (
        <div className="teacher-classes-container">
          {classes.map((cls) => (
            <div key={cls._id} className="class-card teacher-class-card">
              <h2>{cls.className || "Class"}</h2>
              <div className="class-info">{classFields(cls).map((field) => <p key={field.label}><span className="class-field-icon">{field.icon}</span><strong>{field.label}:</strong><span className={field.label === "Status" ? `status-pill status-${field.status || "inactive"}` : ""}>{field.value}</span></p>)}</div>
              <button type="button" className="view-btn" onClick={() => fetchStudents(cls)}>Enter Marks</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MarksTable({ students, allStudents, marks, updateMark, loading, error, retry }) {
  if (loading) return <div className="marks-table-scroll"><table className="marks-table"><thead><tr>{["Roll No", "Student Name", "Marks Obtained", "Maximum Marks", "Grade", "Remarks"].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{[1, 2, 3, 4, 5, 6].map((row) => <tr key={row}>{[1, 2, 3, 4, 5, 6].map((cell) => <td key={cell}><span className="marks-skeleton-cell" /></td>)}</tr>)}</tbody></table></div>;
  if (error) return <StateCard icon={<FaInfoCircle />} title="Could not load students" message={error} action={retry} inline />;
  if (allStudents.length === 0) return <StateCard icon={<div className="empty-illustration">No</div>} title="No students found in this class." message="" inline />;

  return (
    <div className="marks-table-scroll">
      <table className="marks-table">
        <thead><tr>{["Roll No", "Student Name", "Marks Obtained", "Maximum Marks", "Grade", "Remarks"].map((head) => <th key={head}>{head}</th>)}</tr></thead>
        <tbody>
          {students.map((student) => {
            const record = marks[student._id] || {};
            const hasError = Number(record.marksObtained) < 0 || Number(record.marksObtained) > Number(record.maximumMarks);
            return (
              <tr key={student._id}>
                <td>{student.rollNumber || "N/A"}</td>
                <td>{student.fullName || "N/A"}</td>
                <td><input className={hasError ? "marks-input-error" : ""} type="number" min="0" value={record.marksObtained ?? ""} onChange={(e) => updateMark(student._id, "marksObtained", e.target.value)} /></td>
                <td><input type="number" min="1" value={record.maximumMarks ?? "100"} onChange={(e) => updateMark(student._id, "maximumMarks", e.target.value)} /></td>
                <td><span className={`marks-grade marks-grade-${record.grade?.replace("+", "plus") || "empty"}`}>{record.grade || "-"}</span></td>
                <td><input className="marks-remarks-input" value={record.remarks || ""} onChange={(e) => updateMark(student._id, "remarks", e.target.value)} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StateCard({ icon, title, message, action, inline }) {
  return <div className="teacher-classes-state teacher-classes-empty" style={inline ? { boxShadow: "none", border: 0, margin: "0 auto" } : undefined}>{icon}<h2>{title}</h2>{message && <p>{message}</p>}{action && <button type="button" onClick={action}>Retry</button>}</div>;
}

const marksStyles = `
.marks-panel { background: #ffffff; border: 1px solid #dddafa; border-radius: 8px; box-shadow: 0 12px 28px rgba(81, 73, 189, 0.12); overflow: hidden; }
.marks-form-grid { display: grid; grid-template-columns: repeat(4, minmax(160px, 1fr)); gap: 14px; padding: 18px; border-bottom: 1px solid #e5e4f6; }
.marks-form-grid label { display: grid; gap: 7px; color: #5149bd; font-size: 13px; font-weight: 800; }
.marks-form-grid input, .marks-form-grid select { min-height: 38px; padding: 8px 10px; border: 1px solid #c8c4ef; border-radius: 6px; color: #20223a; background: #ffffff; font-weight: 700; outline: none; }
.marks-form-grid input:focus, .marks-form-grid select:focus, .marks-table input:focus { border-color: #5149bd; box-shadow: 0 0 0 2px rgba(81, 73, 189, 0.12); }
.marks-table-scroll { max-height: 650px; overflow: auto; }
.teacher-main-content .marks-table { min-width: 880px; margin: 0; }
.teacher-main-content .marks-table th { position: sticky; top: 0; z-index: 2; }
.teacher-main-content .marks-table tbody tr:nth-child(even) { background: #fbfbff; }
.teacher-main-content .marks-table input { width: 100%; min-width: 90px; height: 36px; }
.teacher-main-content .marks-table .marks-remarks-input { min-width: 190px; }
.marks-input-error { border-color: #c0183d !important; background: #fff7f9 !important; }
.marks-grade { display: inline-grid; min-width: 52px; min-height: 28px; place-items: center; padding: 4px 10px; border-radius: 999px; background: #f0efff; color: #5149bd; font-weight: 900; }
.marks-grade-F { background: #fff0f3; color: #c0183d; }
.marks-actions, .marks-pagination { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 16px 18px; border-top: 1px solid #e5e4f6; background: #ffffff; flex-wrap: wrap; }
.marks-actions .save-btn { margin: 0; }
.marks-secondary-btn { background: #ffffff !important; color: #5149bd !important; border: 1px solid #c8c4ef !important; }
.marks-secondary-btn:hover { background: #f4f3ff !important; }
.teacher-main-content button:disabled { opacity: 0.62; cursor: not-allowed; }
.marks-success, .marks-error { margin: 0 auto 0 0; font-size: 14px; font-weight: 800; }
.marks-success { color: #177a3b; }
.marks-error { color: #c0183d; }
.marks-skeleton-cell { display: block; width: 90px; height: 16px; border-radius: 6px; background: #e8e7f5; }
@media (max-width: 900px) { .marks-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .marks-form-grid { grid-template-columns: 1fr; } .marks-actions, .marks-pagination { justify-content: stretch; } .marks-actions button, .marks-pagination button { flex: 1; } }
`;

export default TeacherMarks;
