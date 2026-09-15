import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./StudentSubjects.css";

function StudentSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [summary, setSummary] = useState({ academicYear: "", class: "", section: "" });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return subjects;
    return subjects.filter((subject) =>
      [subject.subjectName, subject.subjectCode, subject.teacherName, subject.department]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [subjects, search]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError("");
      const userId = getUserId();
      if (!userId) {
        setError("Unable to find the logged-in student. Please log in again.");
        return;
      }

      const response = await axios.get(`/api/students/subjects/${userId}`);
      setSubjects(response.data.subjects || []);
      setSummary({
        academicYear: response.data.academicYear || "",
        class: response.data.class || "",
        section: response.data.section || "",
      });
    } catch (err) {
      console.error("Error loading student subjects:", err);
      setError(err.response?.data?.message || "Unable to load your subjects right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  return (
    <div className="student-subjects-page">
      <div className="student-subjects-header">
        <div>
          <h1>My Subjects</h1>
          <p>Subjects assigned to your class</p>
        </div>
        <input
          type="search"
          placeholder="Search subjects..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="student-subjects-summary">
        <SummaryCard label="Total Subjects" value={subjects.length} />
        <SummaryCard label="Academic Year" value={summary.academicYear || "N/A"} />
        <SummaryCard label="Class" value={summary.class || "N/A"} />
        <SummaryCard label="Section" value={summary.section || "N/A"} />
      </div>

      {loading && <SkeletonSubjects />}

      {!loading && error && (
        <div className="student-subjects-state">
          <div className="student-subjects-state-icon">!</div>
          <h2>Unable to Load Subjects</h2>
          <p>{error}</p>
          <button type="button" onClick={fetchSubjects}>Retry</button>
        </div>
      )}

      {!loading && !error && filteredSubjects.length === 0 && (
        <div className="student-subjects-state">
          <div className="student-subjects-state-icon">📚</div>
          <h2>No Subjects Assigned</h2>
          <p>Your administrator has not assigned any subjects yet.</p>
        </div>
      )}

      {!loading && !error && filteredSubjects.length > 0 && (
        <div className="student-subjects-grid">
          {filteredSubjects.map((subject) => (
            <article key={subject._id} className="student-subject-card">
              <div className="student-subject-title">
                <h2>📘 {subject.subjectName}</h2>
                <span>{subject.subjectCode || "Code N/A"}</span>
              </div>

              <div className="student-subject-details">
                <SubjectField icon="👨‍🏫" label="Teacher" value={formatTeacher(subject)} />
                <SubjectField icon="🏢" label="Department" value={subject.department || "N/A"} />
                <SubjectField icon="🏫" label="Class & Section" value={`${subject.class || "N/A"} - ${subject.section || "N/A"}`} />
                <SubjectField icon="📅" label="Academic Year" value={subject.academicYear || "N/A"} />
              </div>

              <div className="student-subject-status">
                <span className={`subject-status subject-status-${subject.status || "active"}`}>🟢 {capitalize(subject.status || "Active")}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function getUserId() {
  const userVal = localStorage.getItem("user");
  const user = userVal ? JSON.parse(userVal) : null;
  return user?._id || user?.id || "";
}

function SummaryCard({ label, value }) {
  return <div className="student-subject-summary-card"><span>{label}</span><strong>{value}</strong></div>;
}

function SubjectField({ icon, label, value }) {
  return <div className="student-subject-field"><span>{icon}</span><div><small>{label}</small><p>{value}</p></div></div>;
}

function SkeletonSubjects() {
  return <div className="student-subjects-grid">{Array.from({ length: 6 }, (_, index) => <div key={index} className="student-subject-card student-subject-skeleton"><span /><span /><span /><span /></div>)}</div>;
}

function formatTeacher(subject) {
  if (!subject.teacherEmployeeId) return subject.teacherName || "Not Assigned";
  return `${subject.teacherName} (${subject.teacherEmployeeId})`;
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

export default StudentSubjects;
