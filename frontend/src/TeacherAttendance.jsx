import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaBookOpen, FaCalendarAlt, FaInfoCircle, FaLayerGroup, FaSignal, FaUsers } from "react-icons/fa";
import "./TeacherDashboard.css";

function TeacherAttendance() {
  const [activeTab, setActiveTab] = useState("take");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [history, setHistory] = useState([]);
  const [historyDetail, setHistoryDetail] = useState(null);
  const [filters, setFilters] = useState({ classId: "", date: "" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [studentsError, setStudentsError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [saveError, setSaveError] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const teacherId = classes.find((item) => item.classTeacher?._id)?.classTeacher?._id || "";
  const pagedHistory = useMemo(() => history.slice((page - 1) * 10, page * 10), [history, page]);
  const totalPages = Math.max(1, Math.ceil(history.length / 10));

  const [takeFilters, setTakeFilters] = useState({
    className: "",
    section: "",
    subject: "",
    date: today,
  });

  const getUserId = () => {
    const userVal = localStorage.getItem("user");
    const user = userVal ? JSON.parse(userVal) : null;
    return user?.id || user?._id || "";
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
      console.error("Error loading attendance classes:", err);
      setError(err.response?.data?.message || "Unable to load your assigned classes right now.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!teacherId) return;
    try {
      setHistoryLoading(true);
      setHistoryError("");
      const params = new URLSearchParams();
      if (filters.classId) params.append("classId", filters.classId);
      if (filters.date) params.append("date", filters.date);
      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await axios.get(`/api/attendance/history/${teacherId}${query}`);
      setHistory(response.data.history || []);
      setPage(1);
    } catch (err) {
      console.error("Error loading attendance history:", err);
      setHistoryError(err.response?.data?.message || "Unable to load attendance history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadStudentsAndAttendance = async (classItem, date, subject) => {
    if (!classItem) return;
    try {
      setStudentsLoading(true);
      setStudentsError("");
      setSaveError("");
      setStudents([]);
      setAttendance({});

      // 1. Fetch students for this class className & section
      const studentsResponse = await axios.get(`/api/students/class/${classItem._id}`);
      const fetchedStudents = studentsResponse.data.students || [];
      setStudents(fetchedStudents);

      // 2. Fetch existing attendance for this classId, date, and subject
      if (subject) {
        const attendanceResponse = await axios.get(`/api/attendance?class=${classItem._id}&date=${date}&subject=${subject}`);
        const existingRecords = attendanceResponse.data.attendance || [];
        
        const existingMap = {};
        existingRecords.forEach((record) => {
          if (record.student && (record.student._id || record.student)) {
            const sId = record.student._id || record.student;
            existingMap[sId.toString()] = record.status;
          }
        });

        const initialAttendance = {};
        fetchedStudents.forEach((student) => {
          initialAttendance[student._id] = existingMap[student._id.toString()] || "Present";
        });
        setAttendance(initialAttendance);
      } else {
        const initialAttendance = {};
        fetchedStudents.forEach((student) => {
          initialAttendance[student._id] = "Present";
        });
        setAttendance(initialAttendance);
      }
    } catch (err) {
      console.error("Error loading students or attendance:", err);
      setStudentsError(err.response?.data?.message || "Unable to load students or attendance.");
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchHistoryDetail = async (attendanceId) => {
    try {
      setDetailLoading(true);
      const response = await axios.get(`/api/attendance/${attendanceId}`);
      setHistoryDetail(response.data.attendance);
    } catch (err) {
      console.error("Error loading attendance details:", err);
      alert(err.response?.data?.message || "Unable to load attendance details.");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (activeTab === "history" && teacherId) fetchHistory();
  }, [activeTab, teacherId]);

  // Extract unique filter options dynamically from classes list
  const uniqueClassNames = useMemo(() => {
    return Array.from(new Set(classes.map(c => c.className))).sort();
  }, [classes]);

  const uniqueSections = useMemo(() => {
    if (!takeFilters.className) return [];
    return Array.from(new Set(
      classes.filter(c => c.className === takeFilters.className).map(c => c.section)
    )).sort();
  }, [classes, takeFilters.className]);

  const uniqueSubjects = useMemo(() => {
    if (!takeFilters.className || !takeFilters.section) return [];
    return Array.from(new Set(
      classes.filter(c => c.className === takeFilters.className && c.section === takeFilters.section).map(c => c.subject)
    )).sort();
  }, [classes, takeFilters.className, takeFilters.section]);

  useEffect(() => {
    if (takeFilters.className && takeFilters.section) {
      const classItem = classes.find(
        c => c.className === takeFilters.className && c.section === takeFilters.section
      );
      if (classItem) {
        setSelectedClass(classItem);
        loadStudentsAndAttendance(classItem, takeFilters.date, takeFilters.subject);
      } else {
        setSelectedClass(null);
        setStudents([]);
        setAttendance({});
      }
    } else {
      setSelectedClass(null);
      setStudents([]);
      setAttendance({});
    }
  }, [takeFilters.className, takeFilters.section, takeFilters.subject, takeFilters.date, classes]);

  const formatDate = (date) => new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      setSaveError("");

      const matchedClassWithSubject = classes.find(
        c => c.className === takeFilters.className && 
             c.section === takeFilters.section && 
             c.subject === takeFilters.subject
      );

      if (!matchedClassWithSubject) {
        setSaveError("Please select Class, Section, and Subject before saving.");
        return;
      }

      const payload = {
        teacherId: matchedClassWithSubject.classTeacher?._id || matchedClassWithSubject.classTeacher || teacherId,
        classId: matchedClassWithSubject._id,
        date: takeFilters.date,
        attendance: students.map((student) => ({ studentId: student._id, status: attendance[student._id] || "Present" })),
      };

      if (!payload.teacherId) {
        setSaveError("Unable to identify the assigned teacher for this class.");
        return;
      }

      await axios.post("/api/attendance", payload);
      alert("Attendance Saved Successfully");
      
      // Refresh the attendance list
      loadStudentsAndAttendance(matchedClassWithSubject, takeFilters.date, takeFilters.subject);
    } catch (err) {
      console.error("Error saving attendance:", err);
      setSaveError(err.response?.data?.message || "Unable to save attendance right now.");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAllPresent = () => {
    const next = {};
    students.forEach((student) => {
      next[student._id] = "Present";
    });
    setAttendance(next);
  };

  const handleExportPdf = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const csv = ["Roll No,Student Name,Gender,Status", ...students.map((s) => `${s.rollNumber || "N/A"},${s.fullName},${s.gender || "N/A"},${attendance[s._id] || "Present"}`)].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = `attendance-${takeFilters.className}-${takeFilters.section}-${takeFilters.date}.csv`;
    link.click();
  };

  const handleDailyReport = () => {
    alert("Daily report generated");
  };

  const handleMonthlyReport = () => {
    alert("Monthly report generated");
  };

  const renderTabs = () => (
    <div style={styles.tabs}>
      <button type="button" style={activeTab === "take" ? styles.activeTab : styles.tab} onClick={() => setActiveTab("take")}>Take Attendance</button>
      <button type="button" style={activeTab === "history" ? styles.activeTab : styles.tab} onClick={() => setActiveTab("history")}>Attendance History</button>
    </div>
  );

  return (
    <div className="teacher-dashboard-page teacher-classes-page">
      <style>{spinStyle}</style>
      {renderTabs()}
      <div className="teacher-dashboard-header">
        <h1>{activeTab === "take" ? "Take Attendance" : "Attendance History"}</h1>
      </div>
      {activeTab === "take" ? (
        <div style={styles.tablePanel}>
          <div className="attendance-filters-container" style={styles.filters}>
            <div className="attendance-filter-item" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#5149bd" }}>Class</label>
              <select
                value={takeFilters.className}
                onChange={(e) => setTakeFilters({ ...takeFilters, className: e.target.value, section: "", subject: "" })}
                style={styles.input}
              >
                <option value="">Select Class</option>
                {uniqueClassNames.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="attendance-filter-item" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#5149bd" }}>Section</label>
              <select
                value={takeFilters.section}
                onChange={(e) => setTakeFilters({ ...takeFilters, section: e.target.value, subject: "" })}
                disabled={!takeFilters.className}
                style={styles.input}
              >
                <option value="">Select Section</option>
                {uniqueSections.map((sec) => <option key={sec} value={sec}>{sec}</option>)}
              </select>
            </div>

            <div className="attendance-filter-item" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#5149bd" }}>Subject</label>
              <select
                value={takeFilters.subject}
                onChange={(e) => setTakeFilters({ ...takeFilters, subject: e.target.value })}
                disabled={!takeFilters.section}
                style={styles.input}
              >
                <option value="">Select Subject</option>
                {uniqueSubjects.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>

            <div className="attendance-filter-item" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#5149bd" }}>Date</label>
              <input
                type="date"
                value={takeFilters.date}
                onChange={(e) => setTakeFilters({ ...takeFilters, date: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <AttendanceTable
            students={students}
            studentsLoading={studentsLoading}
            studentsError={studentsError}
            attendance={attendance}
            setAttendance={setAttendance}
            retry={() => {
              if (selectedClass) loadStudentsAndAttendance(selectedClass, takeFilters.date, takeFilters.subject);
            }}
          />

          {takeFilters.className && takeFilters.section && takeFilters.subject && students.length > 0 && (
            <div className="attendance-action-toolbar" style={styles.actions}>
              {saveError && <p style={styles.saveError}>{saveError}</p>}
              <div className="attendance-toolbar-row-1">
                <button type="button" className="add-btn mark-present-btn" onClick={handleMarkAllPresent}>
                  Mark All Present
                </button>
              </div>
              <div className="attendance-toolbar-row-2">
                <button type="button" className="save-btn" onClick={handleSaveAttendance} disabled={studentsLoading || saving || students.length === 0}>
                  {saving ? <span style={styles.buttonSpinnerWrap}><span style={styles.buttonSpinner} />Saving...</span> : "Save Attendance"}
                </button>
              </div>
              <div className="attendance-toolbar-row-3">
                <button type="button" className="edit-btn export-pdf-btn" onClick={handleExportPdf}>
                  Export PDF
                </button>
                <button type="button" className="edit-btn export-excel-btn" onClick={handleExportExcel}>
                  Export Excel
                </button>
              </div>
              <div className="attendance-toolbar-row-4">
                <button type="button" className="edit-btn daily-report-btn" onClick={handleDailyReport}>
                  Generate Daily Report
                </button>
              </div>
              <div className="attendance-toolbar-row-5">
                <button type="button" className="edit-btn monthly-report-btn" onClick={handleMonthlyReport}>
                  Generate Monthly Report
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.tablePanel}>
          <div className="attendance-filters-container" style={styles.filters}>
            <select value={filters.classId} onChange={(e) => setFilters({ ...filters, classId: e.target.value })} style={styles.input}>

              <option value="">All Classes</option>
              {classes.map((cls) => <option key={cls._id} value={cls._id}>{cls.className} - {cls.section}</option>)}
            </select>
            <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} style={styles.input} />
            <button type="button" className="save-btn" onClick={fetchHistory}>Search</button>
          </div>
          <HistoryTable
            loading={historyLoading}
            error={historyError}
            history={pagedHistory}
            retry={fetchHistory}
            formatDate={formatDate}
            openDetail={fetchHistoryDetail}
          />
          {history.length > 10 && (
            <div style={styles.pagination}>
              <button type="button" style={styles.cancelButton} disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button type="button" style={styles.cancelButton} disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </div>
      )}
      {detailLoading && <div style={styles.modalBackdrop}><div style={styles.modal}><p>Loading details...</p></div></div>}
      {historyDetail && <HistoryModal detail={historyDetail} close={() => setHistoryDetail(null)} formatDate={formatDate} />}
    </div>
  );
}

function AttendanceTable({ students, studentsLoading, studentsError, attendance, setAttendance, retry }) {
  return (
    <div style={styles.tablePanel}>
      {studentsLoading && <SkeletonTable columns={["Roll No", "Student Name", "Gender", "Status"]} />}
      {!studentsLoading && studentsError && <StateCard icon={<FaInfoCircle />} title="Could not load students" message={studentsError} action={retry} inline />}
      {!studentsLoading && !studentsError && students.length === 0 && <StateCard icon={<div className="empty-illustration">👨‍🎓</div>} title="No Students Found" message="Select Class and Section to load students." inline />}
      {!studentsLoading && !studentsError && students.length > 0 && (
        <div style={styles.tableScroll}><table className="attendance-table" style={styles.table}><thead><tr>{["Roll No", "Student Name", "Gender", "Status"].map((head) => <th key={head} style={styles.stickyHeader}>{head}</th>)}</tr></thead><tbody>{students.map((student, index) => <tr key={student._id} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}><td>{student.rollNumber || "N/A"}</td><td>{student.fullName}</td><td>{student.gender || "N/A"}</td><td><div style={styles.radioGroup}>{["Present", "Absent", "Late"].map((status) => <label key={status} style={styles.radioLabel}><input type="radio" name={`attendance-${student._id}`} value={status} checked={(attendance[student._id] || "Present") === status} onChange={() => setAttendance((current) => ({ ...current, [student._id]: status }))} />{status}</label>)}</div></td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}

function HistoryTable({ loading, error, history, retry, formatDate, openDetail }) {
  if (loading) return <SkeletonTable columns={["Date", "Class", "Section", "Subject", "Students", "Present", "Absent", "Late", "Action"]} />;
  if (error) return <StateCard icon={<FaInfoCircle />} title="Could not load history" message={error} action={retry} inline />;
  if (history.length === 0) return <StateCard icon={<div className="empty-illustration">📅</div>} title="No Attendance Records Found" message="No attendance has been submitted yet." inline />;
  return <div style={styles.tableScroll}><table className="attendance-table" style={styles.table}><thead><tr>{["Date", "Class", "Section", "Subject", "Students", "Present", "Absent", "Late", "Action"].map((head) => <th key={head} style={styles.stickyHeader}>{head}</th>)}</tr></thead><tbody>{history.map((item, index) => <tr key={item._id} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}><td>{formatDate(item.date)}</td><td>{item.class?.className || "N/A"}</td><td>{item.class?.section || "N/A"}</td><td>{item.subject || "N/A"}</td><td>{item.students}</td><td>{item.present}</td><td>{item.absent}</td><td>{item.late}</td><td><button type="button" className="view-btn" onClick={() => openDetail(item._id)}>View</button></td></tr>)}</tbody></table></div>;
}

function SkeletonTable({ columns }) {
  return <div style={styles.tableScroll}><table className="attendance-table" style={styles.table}><thead><tr>{columns.map((head) => <th key={head} style={styles.stickyHeader}>{head}</th>)}</tr></thead><tbody>{[1, 2, 3, 4, 5, 6].map((item) => <tr key={item}>{columns.map((head) => <td key={head}><div style={head.length > 8 ? styles.skeletonCellWide : styles.skeletonCell} /></td>)}</tr>)}</tbody></table></div>;
}

function StateCard({ icon, title, message, action, inline }) {
  return <div className="teacher-classes-state teacher-classes-empty" style={inline ? styles.inlineState : undefined}>{icon}<h2>{title}</h2><p>{message}</p>{action && <button type="button" onClick={action}>Retry</button>}</div>;
}

function HistoryModal({ detail, close, formatDate }) {
  return (
    <div className="teacher-attendance-modal-backdrop" style={styles.modalBackdrop}>
      <div className="teacher-attendance-modal" style={styles.modal}>
        <div style={styles.modalHeader}><h2>Attendance Details</h2><button type="button" style={styles.closeButton} onClick={close}>x</button></div>
        <div style={styles.detailGrid}>
          <p><strong>Attendance Date</strong><span>{formatDate(detail.date)}</span></p>

          <p><strong>Class</strong><span>{detail.class?.className || "N/A"}</span></p>
          <p><strong>Section</strong><span>{detail.class?.section || "N/A"}</span></p>
          <p><strong>Subject</strong><span>{detail.subject || "N/A"}</span></p>
          <p><strong>Teacher</strong><span>{detail.teacher?.fullName || "N/A"}</span></p>
          <p><strong>Academic Year</strong><span>{detail.academicYear || "N/A"}</span></p>
        </div>
        <div style={styles.tableScroll}><table className="attendance-table" style={styles.table}><thead><tr><th style={styles.stickyHeader}>Student Name</th><th style={styles.stickyHeader}>Roll Number</th><th style={styles.stickyHeader}>Status</th></tr></thead><tbody>{detail.students.map((student, index) => <tr key={student._id} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}><td>{student.name}</td><td>{student.rollNumber || "N/A"}</td><td><span style={{ ...styles.badge, ...(student.status === "Present" ? styles.presentBadge : student.status === "Absent" ? styles.absentBadge : styles.lateBadge) }}>{student.status}</span></td></tr>)}</tbody></table></div>
      </div>
    </div>
  );
}

const spinStyle = "@keyframes attendance-spin { to { transform: rotate(360deg); } }";

const styles = {
  tabs: { display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap" },
  tab: { minHeight: "38px", padding: "9px 16px", border: "1px solid #c8c4ef", borderRadius: "6px", background: "#ffffff", color: "#5149bd", fontWeight: 800, cursor: "pointer" },
  activeTab: { minHeight: "38px", padding: "9px 16px", border: "1px solid #5149bd", borderRadius: "6px", background: "#5149bd", color: "#ffffff", fontWeight: 800, cursor: "pointer" },
  tablePanel: { background: "#ffffff", border: "1px solid #dddafa", borderRadius: "8px", boxShadow: "0 12px 28px rgba(81, 73, 189, 0.12)", overflow: "hidden" },
  tableScroll: { maxHeight: "640px", overflow: "auto" },
  table: { margin: 0, minWidth: "760px" },
  stickyHeader: { position: "sticky", top: 0, zIndex: 2 },
  evenRow: { background: "#ffffff" },
  oddRow: { background: "#fbfbff" },
  radioGroup: { display: "flex", flexWrap: "wrap", gap: "14px" },
  radioLabel: { display: "inline-flex", alignItems: "center", gap: "6px", color: "#20223a", fontWeight: 700 },
  actions: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", padding: "18px", borderTop: "1px solid #e5e4f6", background: "#ffffff" },
  saveError: { margin: "0 auto 0 0", color: "#c0183d", fontSize: "14px", fontWeight: 700 },
  buttonSpinnerWrap: { display: "inline-flex", alignItems: "center", gap: "8px" },
  buttonSpinner: { width: "14px", height: "14px", border: "2px solid rgba(255, 255, 255, 0.45)", borderTopColor: "#ffffff", borderRadius: "50%", display: "inline-block", animation: "attendance-spin 0.8s linear infinite" },
  cancelButton: { minHeight: "36px", padding: "8px 16px", background: "#ffffff", color: "#5149bd", border: "1px solid #c8c4ef", borderRadius: "6px", fontSize: "14px", fontWeight: 700, cursor: "pointer" },
  inlineState: { boxShadow: "none", border: 0, margin: "0 auto" },
  skeletonCell: { width: "86px", height: "16px", borderRadius: "6px", background: "#e8e7f5" },
  skeletonCellWide: { width: "170px", height: "16px", borderRadius: "6px", background: "#e8e7f5" },
  filters: { display: "flex", gap: "12px", padding: "18px", borderBottom: "1px solid #e5e4f6", flexWrap: "wrap" },
  input: { minHeight: "38px", padding: "8px 12px", border: "1px solid #c8c4ef", borderRadius: "6px", color: "#20223a", background: "#ffffff", fontWeight: 700 },
  pagination: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", padding: "16px 18px", borderTop: "1px solid #e5e4f6" },
  modalBackdrop: { position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center", padding: "20px", background: "rgba(23, 19, 63, 0.54)" },
  modal: { width: "min(820px, 100%)", maxHeight: "calc(100vh - 40px)", overflowY: "auto", background: "#ffffff", borderRadius: "8px", padding: "24px", boxShadow: "0 24px 70px rgba(23, 19, 63, 0.32)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", borderBottom: "1px solid #e7e5fb", paddingBottom: "12px", marginBottom: "16px" },
  closeButton: { width: "36px", height: "36px", borderRadius: "50%", border: 0, background: "#f0efff", color: "#5149bd", fontWeight: 900, cursor: "pointer" },
  detailGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "18px" },
  badge: { display: "inline-block", minWidth: "70px", padding: "5px 10px", borderRadius: "999px", textAlign: "center", fontSize: "12px", fontWeight: 900 },
  presentBadge: { background: "#e7f8ed", color: "#16733a" },
  absentBadge: { background: "#fff0f3", color: "#c0183d" },
  lateBadge: { background: "#fff5df", color: "#b76a00" },
};

export default TeacherAttendance;

