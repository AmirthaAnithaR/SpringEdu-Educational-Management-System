import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ConfirmDialog from "./ConfirmDialog";
import "./TeacherSidebar.css";

function TeacherSidebar() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    document.body.classList.remove("sidebar-open");
    navigate("/", { replace: true });
  };

  return (
    <div className="teacher-sidebar">
      <ul>
        <li>
          <NavLink to="/teacher-dashboard" end>
            Dashboard
          </NavLink>
        </li>

        <li>
          <NavLink to="/teacher-dashboard/classes">Classes</NavLink>
        </li>

        <li>
          <NavLink to="/teacher-dashboard/attendance">Attendance</NavLink>
        </li>

        <li>
          <NavLink to="/teacher-dashboard/marks">Marks</NavLink>
        </li>

        <li>
          <NavLink to="/teacher-dashboard/notices">Notices</NavLink>
        </li>

        <li>
          <NavLink to="/teacher-dashboard/profile">Profile</NavLink>
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

export default TeacherSidebar;
