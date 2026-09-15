import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FaBell,
  FaBook,
  FaChalkboardTeacher,
  FaClipboardCheck,
  FaLayerGroup,
  FaUserGraduate,
} from "react-icons/fa";
import {
  Bar,
  Doughnut,
} from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

const API_URL = "/api/dashboard";

const chartColors = ["#5149bd", "#10b981", "#f59e0b", "#ef4444", "#2563eb", "#8b5cf6"];

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await axios.get(API_URL);
        setDashboard(response.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const stats = dashboard?.stats || {};
  const charts = dashboard?.charts || {};

  const cardData = [
    { title: "Total Students", count: stats.students || 0, description: "Students enrolled in school", icon: <FaUserGraduate /> },
    { title: "Total Teachers", count: stats.teachers || 0, description: "Active teaching staff", icon: <FaChalkboardTeacher /> },
    { title: "Total Classes", count: stats.classes || 0, description: "Classes configured", icon: <FaLayerGroup /> },
    { title: "Total Subjects", count: stats.subjects || 0, description: "Subjects available", icon: <FaBook /> },
    { title: "Total Notices", count: stats.notices || 0, description: "Notices created", icon: <FaBell /> },
    { title: "Present Today", count: stats.presentToday || 0, description: "Students marked present today", icon: <FaClipboardCheck /> },
  ];

  const makeChartData = (items = [], fallbackLabel) => ({
    labels: items.length ? items.map((item) => item._id || "N/A") : [fallbackLabel],
    datasets: [
      {
        data: items.length ? items.map((item) => item.count) : [0],
        backgroundColor: chartColors,
        borderColor: "#ffffff",
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  });

  const studentsByClassData = useMemo(() => makeChartData(charts.studentsByClass, "No Classes"), [charts.studentsByClass]);
  const studentsByGenderData = useMemo(() => makeChartData(charts.studentsByGender, "No Gender Data"), [charts.studentsByGender]);
  const attendanceOverviewData = useMemo(() => makeChartData(charts.attendanceOverview, "No Attendance"), [charts.attendanceOverview]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
    },
  };

  if (loading) {
    return (
      <div className="admin-dashboard dashboard-pro">
        <h1>Dashboard</h1>
        <div className="dashboard-loading">
          <span className="dashboard-spinner" />
          <p>Loading live dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard dashboard-pro">
        <h1>Dashboard</h1>
        <div className="dashboard-empty">
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard dashboard-pro">
      <div className="dashboard-title-row">
        <div>
          <h1>Dashboard</h1>
          <p>Live overview of students, teachers, classes, attendance, and notices.</p>
        </div>
      </div>

      <div className="dashboard-card-grid">
        {cardData.map((card) => (
          <div className="dashboard-stat-card" key={card.title}>
            <div className="dashboard-card-icon">{card.icon}</div>
            <div>
              <strong>{card.count}</strong>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Analytics</h2>
        </div>
        <div className="dashboard-chart-grid">
          <div className="dashboard-chart-card">
            <h3>Students by Class</h3>
            <div className="dashboard-chart"><Bar data={studentsByClassData} options={chartOptions} /></div>
          </div>
          <div className="dashboard-chart-card">
            <h3>Students by Gender</h3>
            <div className="dashboard-chart"><Doughnut data={studentsByGenderData} options={chartOptions} /></div>
          </div>
          <div className="dashboard-chart-card">
            <h3>Attendance Overview</h3>
            <div className="dashboard-chart"><Doughnut data={attendanceOverviewData} options={chartOptions} /></div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;
