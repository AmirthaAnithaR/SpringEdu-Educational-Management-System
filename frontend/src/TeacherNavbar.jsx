import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/logo.jpg";
import NotificationBell from "./NotificationBell";
import ConfirmDialog from "./ConfirmDialog";

function TeacherNavbar({ onLogout }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  function handleDirectLogout() {
    closeSidebar();
    if (onLogout) onLogout();
    navigate('/', { replace: true });
  }

  const toggleSidebar = () => {
    const nextState = !sidebarOpen;
    setSidebarOpen(nextState);
    if (nextState) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    document.body.classList.remove("sidebar-open");
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (document.body.classList.contains("sidebar-open")) {
        const sidebar = document.querySelector(".teacher-sidebar");
        const hamburger = document.querySelector(".hamburger-btn");
        if (sidebar && !sidebar.contains(e.target) && hamburger && !hamburger.contains(e.target)) {
          closeSidebar();
        }
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeSidebar();
      }
    };

    const handleLinkClick = (e) => {
      if (e.target.closest(".teacher-sidebar a")) {
        closeSidebar();
      }
    };

    document.addEventListener("click", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);
    document.addEventListener("click", handleLinkClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
      document.removeEventListener("click", handleLinkClick);
    };
  }, []);

  return (
    <nav className="teacher-navbar">
      <div className="teacher-navbar-inner">
        {/* Mobile Hamburger Menu (left) */}
        <button type="button" className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle Navigation">
          ☰
        </button>

        {/* Spring Public School Logo (center on mobile) */}
        <div className="navbar-brand">
          <img src={logo} alt="Logo" className="nav-logo" />
          <h1 className="navbar-title">SpringEdu</h1>
        </div>

        {/* Logout/Profile icon (right) */}
        <div className="navbar-right-actions">
          <NotificationBell onClick={() => alert("You have no new notifications.")} />
          <button className="delete-btn logout-btn" onClick={handleDirectLogout}>
            Logout
          </button>
          <button className="profile-icon-btn" onClick={() => setShowLogoutConfirm(true)} aria-label="Logout">
            👤
          </button>
        </div>
      </div>
      {sidebarOpen && (
        <div className="sidebar-drawer-overlay" onClick={closeSidebar} />
      )}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        onConfirm={handleDirectLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </nav>
  );
}

export default TeacherNavbar;

