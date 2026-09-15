import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ConfirmDialog from "./ConfirmDialog";
import "./StudentDashboard.css";

function StudentSidebar() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    document.body.classList.remove("sidebar-open");
    navigate("/", { replace: true });
  };

  return (
    <div className="student-sidebar">
      <ul>
        <li>
          <NavLink to="/student-dashboard" end>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/student-dashboard/profile">Profile</NavLink>
        </li>
        <li>
          <NavLink to="/student-dashboard/subjects">Subjects</NavLink>
        </li>
        <li>
          <NavLink to="/student-dashboard/attendance">Attendance</NavLink>
        </li>
        <li>
          <NavLink to="/student-dashboard/results">Results</NavLink>
        </li>
        <li>
          <NavLink to="/student-dashboard/notices">Notices</NavLink>
        </li>
      </ul>
      <div className="sidebar-footer">
        <button type="button" onClick={() => setShowLogoutConfirm(true)} className="sidebar-logout-btn">
          <span className="sidebar-icon">🚪</span> Logout
        </button>
      </div>
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}

export default StudentSidebar;

