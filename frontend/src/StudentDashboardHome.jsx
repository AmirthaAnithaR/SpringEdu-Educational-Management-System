import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./StudentHome.css";

const emptyDashboard = {
  student: {},
  stats: {},
  recentAttendance: [],
  recentNotices: [],
  upcomingExams: [],
};

function StudentDashboardHome() {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const userId = getUserId();
      if (!userId) {
        setError("Unable to find the logged-in student. Please log in again.");
        return;
      }
      const response = await axios.get(`/api/students/dashboard/${userId}`);
      setDashboard({
        student: response.data.student || {},
        stats: response.data.stats || {},
        recentAttendance: response.data.recentAttendance || [],
        recentNotices: response.data.recentNotices || [],
        upcomingExams: response.data.upcomingExams || [],
      });
    } catch (err) {
      console.error("Error loading student dashboard:", err);
      setError(err.response?.data?.message || "Unable to load your dashboard right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="student-dashboard-home">
        <style>{dashboardStyles}</style>
        <SkeletonDashboard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-dashboard-home">
        <style>{dashboardStyles}</style>
        <div className="student-dashboard-error-state">
          <div className="error-icon">⚠️</div>
          <h2>Could not load dashboard</h2>
          <p>{error}</p>
          <button type="button" className="retry-btn" onClick={fetchDashboard}>Retry</button>
        </div>
      </div>
    );
  }

  const { student, stats, recentAttendance, recentNotices, upcomingExams } = dashboard;

  return (
    <div className="student-dashboard-home">
      <style>{dashboardStyles}</style>

      <section className="student-welcome-card">
        <div className="student-avatar">
          {student.profilePhoto ? <img src={student.profilePhoto} alt={student.fullName} /> : <span>{getInitials(student.fullName)}</span>}
        </div>
        <div className="student-welcome-content">
          <p className="student-greeting">{getGreeting()},</p>
          <h1>{student.fullName}</h1>
          <div className="student-welcome-meta">
            <span>Class: {student.class || "N/A"} - {student.section || "N/A"}</span>
            <span>Roll Number: {student.rollNumber || "N/A"}</span>
            <span>Admission Number: {student.admissionNumber || "N/A"}</span>
            <span>Academic Year: {student.academicYear || "N/A"}</span>
          </div>
        </div>
      </section>

      <section className="student-stat-grid">
        <StatCard icon="📚" label="Subjects" value={stats.totalSubjects ?? 0} />
        <StatCard icon="📅" label="Attendance %" value={`${stats.attendancePercentage ?? 0}%`} />
        <StatCard icon="✅" label="Present Days" value={stats.totalPresentDays ?? 0} />
        <StatCard icon="❌" label="Absent Days" value={stats.totalAbsentDays ?? 0} />
        <StatCard icon="⚠️" label="Late Days" value={stats.totalLateDays ?? 0} />
        <StatCard icon="📢" label="Notices" value={stats.noticesCount ?? 0} />
        <StatCard icon="🏆" label="Total Results" value={stats.totalResults ?? 0} />
        <StatCard icon="📝" label="Upcoming Exams" value={stats.upcomingExamsCount ?? 0} />
      </section>

      <section className="student-dashboard-panels">
        <Panel title="Recent Attendance">
          {recentAttendance.length === 0 ? (
            <EmptyPanel
              title="No Attendance Available"
              description="Your daily attendance history is clear. Attendance will appear here once marked."
              icon="📅"
            />
          ) : (
            recentAttendance.map((item) => (
              <div className="student-list-row" key={item._id}>
                <span>{formatDate(item.date)}</span>
                <strong className={`student-status student-status-${item.status?.toLowerCase()}`}>{item.status}</strong>
              </div>
            ))
          )}
        </Panel>

        <Panel title="Recent Notices">
          {recentNotices.length === 0 ? (
            <EmptyPanel
              title="No Notices Available"
              description="You are all caught up! There are no recent announcements for your class."
              icon="📢"
            />
          ) : (
            recentNotices.map((notice) => (
              <div className="student-list-row" key={notice._id}>
                <span><b>{notice.title}</b><small>{formatDate(notice.date)}</small></span>
                <Link to="/student-dashboard/notices">View</Link>
              </div>
            ))
          )}
        </Panel>

        <Panel title="Upcoming Exams">
          {upcomingExams.length === 0 ? (
            <EmptyPanel
              title="No Upcoming Exams"
              description="No upcoming examinations are currently scheduled for your class."
              icon="📝"
            />
          ) : (
            upcomingExams.map((exam) => (
              <div className="student-list-row" key={exam._id}>
                <span><b>{exam.subject}</b><small>{exam.examType}</small></span>
                <strong>{formatDate(exam.examDate)}</strong>
              </div>
            ))
          )}
        </Panel>
      </section>

      <section className="student-quick-actions">
        <Link to="/student-dashboard/attendance">View Attendance</Link>
        <Link to="/student-dashboard/results">View Marks</Link>
        <Link to="/student-dashboard/subjects">View Subjects</Link>
        <Link to="/student-dashboard/notices">View Notices</Link>
        <Link to="/student-dashboard/profile">Profile</Link>
      </section>
    </div>
  );
}

function getUserId() {
  const userVal = localStorage.getItem("user");
  const user = userVal ? JSON.parse(userVal) : null;
  return user?._id || user?.id || "";
}

function StatCard({ icon, label, value }) {
  return (
    <div className="student-stat-card">
      <span>{icon}</span>
      <p>{label}</p>
      <h2>{value}</h2>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="student-panel">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function EmptyPanel({ title, description, icon }) {
  return (
    <div className="student-empty-panel">
      <div className="empty-illustration">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <>
      <div className="student-skeleton student-skeleton-hero" />
      <div className="student-stat-grid">
        {Array.from({ length: 7 }, (_, index) => (
          <div className="student-skeleton student-skeleton-card" key={index} />
        ))}
      </div>
      <div className="student-dashboard-panels">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="student-skeleton student-skeleton-panel" key={index} />
        ))}
      </div>
    </>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function getInitials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "ST";
}

function formatDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const dashboardStyles = `
.student-dashboard-home {
  padding: 30px;
  background: #f5f7fb;
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  gap: 30px;
}
.student-welcome-card {
  background: linear-gradient(135deg, #5149bd);
  color: white;
  border-radius: 12px;
  padding: 25px 30px;
  box-shadow: 0 6px 18px rgba(81, 73, 189, 0.25);
  display: flex;
  align-items: center;
  gap: 24px;
}
.student-avatar {
  width: 80px;
  height: 80px;
  flex: 0 0 80px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  border: 3px solid rgba(255, 255, 255, 0.45);
  font-size: 26px;
  font-weight: 800;
}
.student-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.student-welcome-content h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  color: #ffffff;
  font-family: inherit;
}
.student-greeting {
  margin: 0 0 6px;
  font-size: 16px;
  opacity: 0.9;
}
.student-welcome-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 14px;
}
.student-welcome-meta span {
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-weight: 700;
  font-size: 13px;
}
.student-stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 25px;
}
.student-stat-card {
  background: white;
  border-radius: 14px;
  padding: 25px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-left: 6px solid #5149bd;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.student-stat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 25px rgba(81, 73, 189, 0.2);
}
.student-stat-card span {
  font-size: 28px;
}
.student-stat-card p {
  margin: 15px 0 8px;
  color: #444;
  font-weight: 600;
  font-size: 16px;
}
.student-stat-card h2 {
  margin: 0;
  color: #5149bd;
  font-size: 36px;
  font-weight: bold;
}
.student-dashboard-panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
}
.student-panel {
  background: white;
  border-radius: 14px;
  padding: 25px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  border-top: 4px solid #5149bd;
  min-height: 280px;
}
.student-panel h2 {
  margin: 0 0 18px;
  color: #17133f;
  font-size: 20px;
  font-weight: 600;
  border-bottom: 1px solid #eeeef8;
  padding-bottom: 10px;
}
.student-list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid #eeeef8;
  color: #20223a;
}
.student-list-row:last-child {
  border-bottom: 0;
}
.student-list-row span {
  display: grid;
  gap: 4px;
}
.student-list-row small {
  color: #6b6e86;
  font-weight: 600;
}
.student-list-row a {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 6px;
  background: #5149bd;
  color: #ffffff;
  text-decoration: none;
  font-weight: 700;
  font-size: 13px;
  transition: background-color 0.2s;
}
.student-list-row a:hover {
  background: #453eaa;
}
.student-status {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}
.student-status-present {
  background: #e7f8ed;
  color: #16733a;
}
.student-status-absent {
  background: #fff0f3;
  color: #c0183d;
}
.student-status-late {
  background: #fff5df;
  color: #b76a00;
}
.student-empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  padding: 20px;
  text-align: center;
  background: #fbfbff;
  border: 1px dashed #dddafa;
  border-radius: 12px;
}
.empty-illustration {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f0efff;
  font-size: 30px;
  margin-bottom: 12px;
  color: #5149bd;
}
.student-empty-panel h3 {
  margin: 0 0 6px;
  color: #17133f;
  font-size: 16px;
  font-weight: 600;
}
.student-empty-panel p {
  margin: 0;
  color: #6b6e86;
  font-size: 13px;
  max-width: 260px;
  line-height: 1.4;
}
.student-quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 18px;
}
.student-quick-actions a {
  min-height: 48px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #dddafa;
  color: #5149bd;
  text-decoration: none;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(81, 73, 189, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
.student-quick-actions a:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 18px rgba(81, 73, 189, 0.12);
  background-color: #fcfcff;
}
.student-dashboard-error-state {
  max-width: 500px;
  margin: 60px auto;
  padding: 35px;
  text-align: center;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  border-top: 5px solid #e70d3d;
}
.student-dashboard-error-state .error-icon {
  font-size: 40px;
  margin-bottom: 15px;
}
.student-dashboard-error-state h2 {
  margin: 0 0 10px;
  color: #17133f;
  font-size: 22px;
}
.student-dashboard-error-state p {
  color: #5c5f78;
  margin-bottom: 25px;
  font-size: 15px;
}
.student-dashboard-error-state .retry-btn {
  min-height: 38px;
  padding: 10px 24px;
  border: 0;
  border-radius: 6px;
  background: #5149bd;
  color: #ffffff;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.student-dashboard-error-state .retry-btn:hover {
  background: #453eaa;
}
.student-skeleton {
  position: relative;
  overflow: hidden;
  background: #e8e7f5;
  border-radius: 14px;
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.student-skeleton {
  background: linear-gradient(90deg, #f0effc 25%, #e5e2f9 50%, #f0effc 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}
.student-skeleton-hero {
  height: 140px;
  border-radius: 12px;
}
.student-skeleton-card {
  height: 140px;
  border-radius: 14px;
}
.student-skeleton-panel {
  height: 280px;
  border-radius: 14px;
}
@media (max-width: 768px) {
  .student-dashboard-home {
    padding: 20px;
    gap: 20px;
  }
  .student-welcome-card {
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  .student-welcome-content h1 {
    font-size: 24px;
  }
  .student-stat-card h2 {
    font-size: 28px;
  }
}
`;

export default StudentDashboardHome;
