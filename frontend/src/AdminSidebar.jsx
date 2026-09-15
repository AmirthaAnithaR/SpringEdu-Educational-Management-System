import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ConfirmDialog from "./ConfirmDialog";

function AdminSidebar() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    document.body.classList.remove("sidebar-open");
    navigate("/", { replace: true });
  };

  return (
    <div className="admin-sidebar">
      <ul>
        <li>
          <NavLink to="/admin" end>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/students">Students</NavLink>
        </li>
        <li>
          <NavLink to="/admin/teachers">Teachers</NavLink>
        </li>
        <li>
          <NavLink to="/admin/classes">Classes</NavLink>
        </li>
        <li>
          <NavLink to="/admin/attendance-reports">Attendance</NavLink>
        </li>
        <li>
          <NavLink to="/admin/notices">Notices</NavLink>
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

export default AdminSidebar;

