function Dashboard() {
  return (
    <div className="admin-dashboard">
      <h1>Dashboard</h1>
      <div className="admin-dashboard-cards">
        <div className="admin-dashboard-card">
          <h2>Total Students</h2>
          <p>500</p>
        </div>
        <div className="admin-dashboard-card">
          <h2>Total Teachers</h2>
          <p>25</p>
        </div>
        <div className="admin-dashboard-card">
          <h2>Total Classes</h2>
          <p>15</p>
        </div>
        <div className="admin-dashboard-card">
          <h2>Total Subjects</h2>
          <p>10</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;