import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./TeacherDashboard.css";

function TeacherDashboardHome() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      // Logged in user
      const userVal = localStorage.getItem("user");
      const user = userVal ? JSON.parse(userVal) : null;

      const userId = user?._id || user?.id;

      if (!userId) {
        navigate("/", { replace: true });
        return;
      }

      const apiUrl = `/api/teachers/dashboard/${userId}`;
      const res = await axios.get(apiUrl);

      setDashboard(res.data.dashboard);
    } catch (err) {
      console.log("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return <h2>Loading Dashboard...</h2>;
  }

  const getDisplayValue = (val) => {
    if (val === null || val === undefined || val === "") {
      return "Not Assigned";
    }
    return val;
  };

  return (
    <div className="teacher-dashboard-page">

      <div className="teacher-dashboard-header">
        <h1>{greeting()}, {dashboard?.teacherName} 👋</h1>

        <p>
          Department : <b>{getDisplayValue(dashboard?.department)}</b>
        </p>

        <p>
          Subject : <b>{getDisplayValue(dashboard?.subject)}</b>
        </p>

        <p>
          Assigned Class :{" "}
          <b>{getDisplayValue(dashboard?.assignedClass)}</b>
        </p>
      </div>

      <div className="teacher-dashboard-cards">

        <div className="teacher-dashboard-card">
          <h2>My Classes</h2>
          <p>{dashboard?.totalClasses}</p>
        </div>

        <div className="teacher-dashboard-card">
          <h2>Total Students</h2>
          <p>{dashboard?.totalStudents}</p>
        </div>

        <div className="teacher-dashboard-card">
          <h2>Subjects Handling</h2>
          <p>{dashboard?.totalSubjects}</p>
        </div>

        <div className="teacher-dashboard-card">
          <h2>Today's Attendance</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            <p style={{ margin: 0, fontSize: '15px', color: '#333' }}>Present Today: <strong style={{ color: '#16733a' }}>{dashboard?.todayAttendance?.present ?? 0}</strong></p>
            <p style={{ margin: 0, fontSize: '15px', color: '#333' }}>Absent Today: <strong style={{ color: '#c0183d' }}>{dashboard?.todayAttendance?.absent ?? 0}</strong></p>
            <p style={{ margin: 0, fontSize: '15px', color: '#333' }}>Late Today: <strong style={{ color: '#b76a00' }}>{dashboard?.todayAttendance?.late ?? 0}</strong></p>
          </div>
        </div>

      </div>

    </div>
  );
}

export default TeacherDashboardHome;