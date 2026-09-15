import { useEffect, useState } from "react";
import axios from "axios";
import "./StudentResult.css";

function StudentResults() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterExam, setFilterExam] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const getUserId = () => {
    const userVal = localStorage.getItem("user");
    const user = userVal ? JSON.parse(userVal) : null;
    return user?._id || user?.id || "";
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError("");
      const userId = getUserId();
      if (!userId) {
        setError("Unable to identify logged-in student. Please log in again.");
        return;
      }
      const response = await axios.get(`/api/students/results/${userId}`);
      setData(response.data);
    } catch (err) {
      console.error("Error fetching student results:", err);
      setError(err.response?.data?.message || "Failed to load results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="student-results-container">
        <style>{resultsStyles}</style>
        <SkeletonResults />
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-results-container">
        <style>{resultsStyles}</style>
        <div className="results-error-card">
          <div className="error-icon">⚠️</div>
          <h2>Failed to Load Results</h2>
          <p>{error}</p>
          <button type="button" className="retry-btn" onClick={fetchResults}>Retry</button>
        </div>
      </div>
    );
  }

  const { records = [], overallPercentage = 0, cgpa = null } = data || {};

  // Extract unique subjects & exams for filter dropdowns
  const uniqueSubjects = Array.from(new Set(records.map((r) => r.subject).filter(Boolean)));
  const uniqueExams = Array.from(new Set(records.map((r) => r.examType).filter(Boolean)));

  // Filter records
  const filteredRecords = records.filter((record) => {
    if (filterExam && record.examType !== filterExam) return false;
    if (filterSubject && record.subject !== filterSubject) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchSubject = record.subject?.toLowerCase().includes(query);
      const matchExam = record.examType?.toLowerCase().includes(query);
      const matchRemarks = record.remarks?.toLowerCase().includes(query);
      if (!matchSubject && !matchExam && !matchRemarks) return false;
    }
    return true;
  });

  // Calculate dynamic Grade Distribution from filtered records
  const gradeDistribution = filteredRecords.reduce((acc, record) => {
    if (record.grade) {
      acc[record.grade] = (acc[record.grade] || 0) + 1;
    }
    return acc;
  }, {});

  const downloadReportCard = () => {
    if (filteredRecords.length === 0) return;
    const headers = ["Exam Type", "Subject", "Marks Obtained", "Maximum Marks", "Percentage", "Grade", "Remarks"];
    const rows = filteredRecords.map((r) => [
      r.examType,
      r.subject,
      r.marksObtained,
      r.maximumMarks,
      `${r.percentage}%`,
      r.grade,
      r.remarks,
    ]);

    // Build CSV Content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += [headers.join(","), ...rows.map((e) => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_Card_${getUserId()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="student-results-container">
      <style>{resultsStyles}</style>

      <h1>My Academic Results</h1>

      <div className="results-summary-section">
        <div className="results-summary-card">
          <p>Overall Average</p>
          <h3>{overallPercentage}%</h3>
        </div>
        <div className="results-summary-card">
          <p>CGPA Equivalent</p>
          <h3>{cgpa ? `${cgpa} / 10.0` : "N/A"}</h3>
        </div>
        <div className="results-summary-card">
          <p>Total Exams Recorded</p>
          <h3>{records.length}</h3>
        </div>
      </div>

      {filteredRecords.length > 0 && (
        <div className="grade-distribution-section">
          <h4>Grade Distribution (Filtered Results)</h4>
          <div className="grade-pills">
            {Object.entries(gradeDistribution)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([grade, count]) => (
                <div key={grade} className="grade-pill">
                  {grade} <span>{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="results-filters-bar">
        <div className="filters-left">
          <input
            type="text"
            placeholder="Search subject, exam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select value={filterExam} onChange={(e) => setFilterExam(e.target.value)}>
            <option value="">All Exams</option>
            {uniqueExams.map((exam) => (
              <option key={exam} value={exam}>{exam}</option>
            ))}
          </select>

          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {uniqueSubjects.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        <button type="button" className="download-btn" onClick={downloadReportCard} disabled={filteredRecords.length === 0}>
          📥 Download CSV Report
        </button>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="results-empty-state">
          <div className="empty-icon">🏆</div>
          <h3>No Results Found</h3>
          <p>We couldn't find any results logs matching your query or filter parameters.</p>
        </div>
      ) : (
        <table className="student-results-table">
          <thead>
            <tr>
              <th>Exam Type</th>
              <th>Subject</th>
              <th>Marks Obtained</th>
              <th>Maximum Marks</th>
              <th>Percentage</th>
              <th>Grade</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record._id}>
                <td><b>{record.examType}</b></td>
                <td>{record.subject}</td>
                <td>{record.marksObtained}</td>
                <td>{record.maximumMarks}</td>
                <td><b>{record.percentage}%</b></td>
                <td>
                  <span className={`grade-badge grade-${record.grade?.toLowerCase()?.replace("+", "-plus")}`}>
                    {record.grade}
                  </span>
                </td>
                <td className="remarks-cell">{record.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SkeletonResults() {
  return (
    <>
      <div className="student-skeleton" style={{ width: "260px", height: "36px", marginBottom: "25px" }} />
      <div className="results-summary-section">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="student-skeleton" style={{ height: "92px", borderRadius: "12px" }} />
        ))}
      </div>
      <div className="student-skeleton" style={{ height: "80px", marginBottom: "25px", borderRadius: "12px" }} />
      <div className="student-skeleton" style={{ height: "62px", marginBottom: "25px", borderRadius: "10px" }} />
      <div className="student-skeleton" style={{ height: "350px", borderRadius: "8px" }} />
    </>
  );
}

const resultsStyles = `
.results-summary-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 25px;
}
.results-summary-card {
  background: white;
  padding: 25px;
  border-radius: 14px;
  border-left: 6px solid #5149bd;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}
.results-summary-card p {
  margin: 0 0 8px;
  color: #5c5f78;
  font-size: 13px;
  font-weight: 700;
}
.results-summary-card h3 {
  margin: 0;
  font-size: 28px;
  color: #17133f;
  font-weight: bold;
}
.results-filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  background: white;
  padding: 18px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(81, 73, 189, 0.06);
}
.filters-left {
  display: flex;
  gap: 15px;
  flex: 1;
}
.results-filters-bar input, .results-filters-bar select {
  padding: 9px 14px;
  border-radius: 6px;
  border: 1px solid #c8c4ef;
  color: #20223a;
  outline: none;
  font-size: 14px;
  font-weight: 600;
  background: white;
}
.results-filters-bar input {
  flex: 1;
  max-width: 250px;
}
.results-filters-bar select {
  cursor: pointer;
  min-width: 150px;
}
.results-filters-bar select:focus, .results-filters-bar input:focus {
  border-color: #5149bd;
  box-shadow: 0 0 0 2px rgba(81, 73, 189, 0.1);
}
.download-btn {
  background: #5149bd;
  color: white;
  border: 0;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
}
.download-btn:hover:not(:disabled) {
  background: #453eaa;
}
.download-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.grade-distribution-section {
  background: white;
  padding: 20px 25px;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  margin-bottom: 25px;
}
.grade-distribution-section h4 {
  margin: 0 0 15px;
  color: #17133f;
  font-size: 16px;
  font-weight: 700;
}
.grade-pills {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.grade-pill {
  background: #f4f3ff;
  border: 1px solid #dddafa;
  border-radius: 8px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #5149bd;
}
.grade-pill span {
  background: #5149bd;
  color: white;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}
.grade-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  display: inline-block;
  text-align: center;
  min-width: 44px;
}
.grade-a-plus, .grade-a { background: #e7f8ed; color: #16733a; }
.grade-b-plus, .grade-b { background: #e8f4fd; color: #0b5ed7; }
.grade-c { background: #fff5df; color: #b76a00; }
.grade-d { background: #f8f9fa; color: #6b6e86; }
.grade-f { background: #fff0f3; color: #c0183d; }

.remarks-cell {
  color: #6b6e86;
  font-style: italic;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.results-empty-state {
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
.results-empty-state h3 {
  margin: 0 0 8px;
  color: #17133f;
  font-size: 18px;
  font-weight: bold;
}
.results-empty-state p {
  margin: 0;
  color: #6b6e86;
  font-size: 14px;
  max-width: 320px;
  line-height: 1.5;
}

.results-error-card {
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
.results-error-card h2 {
  margin: 0 0 10px;
  color: #17133f;
  font-size: 22px;
}
.results-error-card p {
  color: #5c5f78;
  margin-bottom: 25px;
  font-size: 15px;
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

@media (max-width: 900px) {
  .results-summary-section {
    grid-template-columns: 1fr;
  }
  .results-filters-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .filters-left {
    flex-direction: column;
  }
  .results-filters-bar input {
    max-width: none;
  }
  .download-btn {
    width: 100%;
    justify-content: center;
  }
}
`;

export default StudentResults;