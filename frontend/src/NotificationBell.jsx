import React from "react";

function NotificationBell({ onClick, count = 0 }) {
  return (
    <button
      type="button"
      className="notification-bell-btn"
      aria-label="Notifications"
      onClick={onClick}
    >
      🔔
      {count > 0 && <span className="notification-badge">{count}</span>}
    </button>
  );
}

export default NotificationBell;
