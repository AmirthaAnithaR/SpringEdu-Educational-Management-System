import "./StudentHome.css";

function StudentHome() {
  return (
    <div className="student-home">
      <div className="student-home-header">
        <h1>Student Dashboard</h1>
      </div>

      <div className="student-cards">
        <div className="student-card">
          <h2>Total Subjects</h2>
          <p>6</p>
        </div>
        <div className="student-card">
          <h2>Attendance Rate</h2>
          <p>95%</p>
        </div>
        <div className="student-card">
          <h2>Average Score</h2>
          <p>88</p>
        </div>
        <div className="student-card">
          <h2>New Notices</h2>
          <p>3</p>
        </div>
      </div>
    </div>
  );
}

export default StudentHome;
