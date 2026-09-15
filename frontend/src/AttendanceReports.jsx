import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

function AttendanceReports() {
  const today = new Date().toISOString().slice(0, 10);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [draft, setDraft] = useState({});
  const [toast, setToast] = useState("");

  const fetchData = useCallback(async () => {
    const [studentsRes, attendanceRes] = await Promise.all([
      axios.get("/api/students"),
      axios.get(`/api/attendance?date=${selectedDate}`),
    ]);
    setStudents(studentsRes.data.students || []);
    setRecords(attendanceRes.data.attendance || []);
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const visibleStudents = students.filter((student) =>
    (!selectedClass || student.className === selectedClass) &&
    (!selectedSection || student.section === selectedSection) &&
    (!selectedStudent || student._id === selectedStudent)
  );

  const summary = useMemo(() => {
    const todays = records.filter((r) => r.date?.slice(0, 10) === selectedDate);
    const present = todays.filter((r) => r.status === "Present").length;
    const absent = todays.filter((r) => r.status === "Absent").length;
    return { present, absent, percent: todays.length ? Math.round((present / todays.length) * 100) : 0 };
  }, [records, selectedDate]);

  const statusFor = (studentId) => draft[studentId]?.status || records.find((r) => r.student?._id === studentId || r.student === studentId)?.status || "Present";
  const remarksFor = (studentId) => draft[studentId]?.remarks || records.find((r) => r.student?._id === studentId || r.student === studentId)?.remarks || "";

  const setStatus = (student, status) => setDraft({ ...draft, [student._id]: { student: student._id, date: selectedDate, status, remarks: remarksFor(student._id) } });
  const markAllPresent = () => {
    const next = {};
    visibleStudents.forEach((student) => { next[student._id] = { student: student._id, date: selectedDate, status: "Present", remarks: "" }; });
    setDraft(next);
  };

  const saveAttendance = async () => {
    const recordsToSave = visibleStudents.map((student) => ({
      student: student._id,
      date: selectedDate,
      status: statusFor(student._id),
      remarks: remarksFor(student._id),
    }));
    await axios.post("/api/attendance", { records: recordsToSave });
    setToast("Attendance saved successfully");
    setDraft({});
    fetchData();
  };

  const deleteRecord = async (studentId) => {
    const record = records.find((r) => r.student?._id === studentId || r.student === studentId);
    if (!record) return;
    await axios.delete(`/api/attendance/${record._id}`);
    setToast("Attendance record deleted");
    fetchData();
  };

  const exportExcel = () => {
    const csv = ["Roll No,Student Name,Status,Remarks", ...visibleStudents.map((s) => `${s.rollNumber},${s.name},${statusFor(s._id)},${remarksFor(s._id)}`)].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = `attendance-${selectedDate}.csv`;
    link.click();
  };

  return (
    <div className="attendance-container">
      {toast && <div className="toast-message">{toast}</div>}
      <div className="student-header">
        <h1>Attendance</h1>
        <div className="filters">
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}><option value="">All Classes</option>{[...new Set(students.map((s) => s.className).filter(Boolean))].map((c) => <option key={c}>{c}</option>)}</select>
          <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}><option value="">All Sections</option>{["A","B","C","D"].map((s) => <option key={s}>{s}</option>)}</select>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="search" />
          <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}><option value="">All Students</option>{students.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select>
        </div>
      </div>
      <div className="admin-dashboard-cards">
        <div className="admin-dashboard-card"><h2>Present Today</h2><p>{summary.present}</p></div>
        <div className="admin-dashboard-card"><h2>Absent Today</h2><p>{summary.absent}</p></div>
        <div className="admin-dashboard-card"><h2>Attendance %</h2><p>{summary.percent}%</p></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 15, flexWrap: "wrap" }}>
        <button className="add-btn" onClick={markAllPresent}>Mark All Present</button>
        <button className="add-btn" onClick={saveAttendance}>Save Attendance</button>
        <button className="edit-btn" onClick={() => window.print()}>Export PDF</button>
        <button className="edit-btn" onClick={exportExcel}>Export Excel</button>
        <button className="edit-btn" onClick={() => setToast("Daily report generated")}>Generate Daily Report</button>
        <button className="edit-btn" onClick={() => setToast("Monthly report generated")}>Generate Monthly Report</button>
      </div>
      <div className="table-container">
        <table className="attendance-table">
          <thead><tr><th>Roll No</th><th>Student Name</th><th>Present</th><th>Absent</th><th>Late</th><th>Leave</th><th>Remarks</th><th>Action</th></tr></thead>
          <tbody>{visibleStudents.map((student) => <tr key={student._id}><td>{student.rollNumber}</td><td>{student.name}</td>{["Present","Absent","Late","Leave"].map((status) => <td key={status}><input type="radio" name={`status-${student._id}`} checked={statusFor(student._id) === status} onChange={() => setStatus(student, status)} /></td>)}<td><input value={remarksFor(student._id)} onChange={(e) => setDraft({ ...draft, [student._id]: { student: student._id, date: selectedDate, status: statusFor(student._id), remarks: e.target.value } })} /></td><td><button className="delete-btn" onClick={() => deleteRecord(student._id)}>Delete</button></td></tr>)}</tbody>
        </table>
        {visibleStudents.length === 0 && <div className="empty-state"><div className="empty-icon">🗓</div><h2>No students found</h2><p>Adjust filters to mark attendance.</p></div>}
      </div>
    </div>
  );
}

export default AttendanceReports;
