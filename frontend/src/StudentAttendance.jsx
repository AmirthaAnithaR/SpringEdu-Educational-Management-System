import { useEffect, useState } from "react";
import axios from "axios";
import "./StudentAttendance.css";

function StudentAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterMonth, setFilterMonth] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const getUserId = () => {
    const userVal = localStorage.getItem("user");
    const user = userVal ? JSON.parse(userVal) : null;
    return user?._id || user?.id || "";
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError("");
      const userId = getUserId();
      if (!userId) {
        setError("Unable to identify logged-in student. Please log in again.");
        return;
      }
      const response = await axios.get(`/api/students/attendance/${userId}`);
      setData(response.data);
    } catch (err) {
      console.error("Error fetching student attendance:", err);
      setError(err.response?.data?.message || "Failed to load attendance report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="student-attendance-container">
        <style>{attendanceStyles}</style>
        <SkeletonAttendance />
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-attendance-container">
        <style>{attendanceStyles}</style>
        <div className="attendance-error-card">
          <div className="error-icon">⚠️</div>
          <h2>Failed to Load Attendance</h2>
          <p>{error}</p>
          <button type="button" className="retry-btn" onClick={fetchAttendance}>Retry</button>
        </div>
      </div>
    );
  }

  const { records = [], summary = {} } = data || {};

  // Extract unique subjects from records for the filter dropdown
  const uniqueSubjects = Array.from(new Set(records.map((r) => r.subject).filter(Boolean)));

  // Filter logic
  const filteredRecords = records.filter((record) => {
    // Month filter
    if (filterMonth) {
      const recordDate = new Date(record.date);
      const recordMonth = String(recordDate.getMonth() + 1).padStart(2, "0");
      if (recordMonth !== filterMonth) return false;
    }
    // Subject filter
    if (filterSubject && record.subject !== filterSubject) {
      return false;
    }
    // Status filter
    if (filterStatus && record.status !== filterStatus) {
      return false;
    }
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="student-attendance-container">
      <style>{attendanceStyles}</style>
      
      <h1>Attendance Report</h1>

      <div className="attendance-layout">
        <div className="attendance-left">
          <div className="attendance-summary-grid">
            <div className="attendance-summary-card">
              <p>Total Working Days</p>
              <h3>{summary.totalWorkingDays ?? 0}</h3>
            </div>
            <div className="attendance-summary-card">
              <p>Present Days</p>
              <h3 className="text-success">{summary.presentDays ?? 0}</h3>
            </div>
            <div className="attendance-summary-card">
              <p>Absent Days</p>
              <h3 className="text-danger">{summary.absentDays ?? 0}</h3>
            </div>
            <div className="attendance-summary-card">
              <p>Late Days</p>
              <h3 className="text-warning">{summary.lateDays ?? 0}</h3>
            </div>
          </div>
        </div>

        <div className="attendance-right">
          <div className="attendance-percentage-section">
            <div className="progress-circle-container">
              <svg className="progress-circle" viewBox="0 0 100 100">
                <circle className="progress-circle-bg" cx="50" cy="50" r="40" />
                <circle
                  className="progress-circle-bar"
                  cx="50"
                  cy="50"
                  r="40"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * (summary.attendancePercentage ?? 0)) / 100}
                />
              </svg>
              <div className="progress-circle-text">
                <h2>{summary.attendancePercentage ?? 0}%</h2>
                <p>Attendance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="attendance-filters">
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
          <option value="">All Months</option>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>

        <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
          <option value="">All Subjects</option>
          {uniqueSubjects.map((sub) => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Late">Late</option>
        </select>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="attendance-empty-state">
          <div className="empty-icon">📅</div>
          <h3>No Attendance Found</h3>
          <p>We couldn't find any attendance logs matching your current filters.</p>
        </div>
      ) : (
        <table className="student-attendance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Subject</th>
              <th>Teacher</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record._id}>
                <td>{formatDate(record.date)}</td>
                <td>{record.subject}</td>
                <td>{record.teacher}</td>
                <td>
                  <span className={`attendance-status-badge ${record.status?.toLowerCase()}`}>
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SkeletonAttendance() {
  return (
    <>
      <div className="student-skeleton" style={{ width: "220px", height: "36px", marginBottom: "25px" }} />
      <div className="attendance-layout">
        <div className="attendance-left">
          <div className="attendance-summary-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="student-skeleton" style={{ height: "92px", borderRadius: "12px" }} />
            ))}
          </div>
        </div>
        <div className="attendance-right">
          <div className="student-skeleton" style={{ height: "190px", borderRadius: "12px" }} />
        </div>
      </div>
      <div className="student-skeleton" style={{ height: "62px", marginBottom: "25px", borderRadius: "10px" }} />
      <div className="student-skeleton" style={{ height: "320px", borderRadius: "8px" }} />
    </>
  );
}

const attendanceStyles = `
.attendance-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 25px;
  margin-bottom: 25px;
  align-items: stretch;
}
.attendance-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.attendance-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.attendance-summary-card {
  background: white;
  padding: 25px 20px;
  border-radius: 14px;
  border-left: 6px solid #5149bd;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}
.attendance-summary-card p {
  margin: 0 0 8px;
  color: #5c5f78;
  font-size: 13px;
  font-weight: 700;
}
.attendance-summary-card h3 {
  margin: 0;
  font-size: 28px;
  color: #17133f;
  font-weight: bold;
}
.text-success { color: #16733a !important; }
.text-danger { color: #c0183d !important; }
.text-warning { color: #b76a00 !important; }

.attendance-percentage-section {
  background: white;
  padding: 20px;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  box-sizing: border-box;
}
.progress-circle-container {
  position: relative;
  width: 140px;
  height: 140px;
}
.progress-circle {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.progress-circle-bg {
  fill: none;
  stroke: #f0efff;
  stroke-width: 8;
}
.progress-circle-bar {
  fill: none;
  stroke: #5149bd;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.6s ease;
}
.progress-circle-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
.progress-circle-text h2 {
  margin: 0;
  font-size: 26px;
  color: #17133f;
  font-weight: bold;
}
.progress-circle-text p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #6b6e86;
  font-weight: 700;
  text-transform: uppercase;
}

.attendance-filters {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  background: white;
  padding: 18px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(81, 73, 189, 0.06);
}
.attendance-filters select {
  padding: 9px 14px;
  border-radius: 6px;
  border: 1px solid #c8c4ef;
  color: #20223a;
  outline: none;
  font-size: 14px;
  min-width: 150px;
  background: white;
  cursor: pointer;
  font-weight: 600;
}
.attendance-filters select:focus {
  border-color: #5149bd;
  box-shadow: 0 0 0 2px rgba(81, 73, 189, 0.1);
}

.attendance-status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  display: inline-block;
  text-align: center;
  min-width: 70px;
}
.attendance-status-badge.present { background: #e7f8ed; color: #16733a; }
.attendance-status-badge.absent { background: #fff0f3; color: #c0183d; }
.attendance-status-badge.late { background: #fff5df; color: #b76a00; }

.attendance-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: white;
  border: 1px dashed #dddafa;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
  width: 80px;
  height: 80px;
  display: grid;
  place-items: center;
  background: #f4f3ff;
  border-radius: 50%;
  color: #5149bd;
}
.attendance-empty-state h3 {
  margin: 0 0 8px;
  color: #17133f;
  font-size: 18px;
  font-weight: bold;
}
.attendance-empty-state p {
  margin: 0;
  color: #6b6e86;
  font-size: 14px;
  max-width: 320px;
  line-height: 1.5;
}

.attendance-error-card {
  max-width: 500px;
  margin: 60px auto;
  padding: 35px;
  text-align: center;
  background: white;
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  border-top: 5px solid #e70d3d;
}
.error-icon {
  font-size: 40px;
  margin-bottom: 15px;
}
.attendance-error-card h2 {
  margin: 0 0 10px;
  color: #17133f;
  font-size: 22px;
}
.attendance-error-card p {
  color: #5c5f78;
  margin-bottom: 25px;
  font-size: 15px;
}
.retry-btn {
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
.retry-btn:hover {
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

@media (max-width: 980px) {
  .attendance-layout {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .attendance-summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .attendance-filters {
    flex-direction: column;
    align-items: stretch;
  }
}
`;

export default StudentAttendance;