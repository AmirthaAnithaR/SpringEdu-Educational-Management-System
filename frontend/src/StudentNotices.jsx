import { useEffect, useState } from "react";
import axios from "axios";
import "./StudentNotices.css";

function StudentNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal and filters state
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  const getUserId = () => {
    const userVal = localStorage.getItem("user");
    const user = userVal ? JSON.parse(userVal) : null;
    return user?._id || user?.id || "";
  };

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError("");
      const userId = getUserId();
      if (!userId) {
        setError("Unable to identify logged-in student. Please log in again.");
        return;
      }
      const response = await axios.get(`/api/students/notices/${userId}`);
      setNotices(response.data.notices || []);
    } catch (err) {
      console.error("Error fetching student notices:", err);
      setError(err.response?.data?.message || "Failed to load notices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="student-notices-container">
        <style>{noticesStyles}</style>
        <SkeletonNotices />
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-notices-container">
        <style>{noticesStyles}</style>
        <div className="notices-error-card">
          <div className="error-icon">⚠️</div>
          <h2>Failed to Load Notices</h2>
          <p>{error}</p>
          <button type="button" className="retry-btn" onClick={fetchNotices}>Retry</button>
        </div>
      </div>
    );
  }

  // Categories & Priorities
  const uniqueCategories = Array.from(new Set(notices.map((n) => n.category).filter(Boolean)));
  const uniquePriorities = Array.from(new Set(notices.map((n) => n.priority).filter(Boolean)));

  // Filter notices
  const filteredNotices = notices.filter((notice) => {
    if (filterCategory && notice.category !== filterCategory) return false;
    if (filterPriority && notice.priority !== filterPriority) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchTitle = notice.title?.toLowerCase().includes(query);
      const matchMsg = notice.message?.toLowerCase().includes(query);
      if (!matchTitle && !matchMsg) return false;
    }
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateMessage = (message = "", length = 120) => {
    if (message.length <= length) return message;
    return message.substring(0, length) + "...";
  };

  return (
    <div className="student-notices-container">
      <style>{noticesStyles}</style>

      <h1>Notices & Announcements</h1>

      <div className="notices-filter-bar">
        <input
          type="text"
          placeholder="Search notices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {uniquePriorities.map((pri) => (
            <option key={pri} value={pri}>{pri}</option>
          ))}
        </select>
      </div>

      {filteredNotices.length === 0 ? (
        <div className="notices-empty-state">
          <div className="empty-icon">📢</div>
          <h3>No Notices Found</h3>
          <p>No announcements or notices match your search criteria or are published for your class.</p>
        </div>
      ) : (
        <div className="notices-grid">
          {filteredNotices.map((notice) => (
            <div className="notice-card" key={notice._id}>
              <div>
                <div className="notice-header">
                  <div className="notice-badge-group">
                    <span className="notice-badge badge-category">{notice.category}</span>
                    <span className={`notice-badge badge-priority-${notice.priority?.toLowerCase()}`}>
                      {notice.priority}
                    </span>
                  </div>
                </div>
                <h3>{notice.title}</h3>
                <div className="notice-date">📅 {formatDate(notice.publishDate)}</div>
                <p className="notice-message-short">{truncateMessage(notice.message)}</p>
              </div>
              <button
                type="button"
                className="view-notice-btn"
                onClick={() => setSelectedNotice(notice)}
              >
                View Full Notice
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className="notice-modal-backdrop" onClick={() => setSelectedNotice(null)}>
          <div className="notice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notice-modal-header">
              <h2>{selectedNotice.title}</h2>
              <button type="button" className="close-modal-btn" onClick={() => setSelectedNotice(null)}>
                ✕
              </button>
            </div>
            <div className="notice-modal-body">
              <div className="notice-modal-meta">
                <span className="notice-badge badge-category">{selectedNotice.category}</span>
                <span className={`notice-badge badge-priority-${selectedNotice.priority?.toLowerCase()}`}>
                  {selectedNotice.priority}
                </span>
                <span className="notice-date">📅 {formatDate(selectedNotice.publishDate)}</span>
              </div>
              <div className="notice-modal-text">{selectedNotice.message}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonNotices() {
  return (
    <>
      <div className="student-skeleton" style={{ width: "240px", height: "36px", marginBottom: "25px" }} />
      <div className="student-skeleton" style={{ height: "62px", marginBottom: "25px", borderRadius: "10px" }} />
      <div className="notices-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="student-skeleton" style={{ height: "220px", borderRadius: "12px" }} />
        ))}
      </div>
    </>
  );
}

const noticesStyles = `
.notices-filter-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  background: white;
  padding: 18px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(81, 73, 189, 0.06);
}
.notices-filter-bar input, .notices-filter-bar select {
  padding: 9px 14px;
  border-radius: 6px;
  border: 1px solid #c8c4ef;
  color: #20223a;
  outline: none;
  font-size: 14px;
  font-weight: 600;
  background: white;
}
.notices-filter-bar input {
  flex: 1;
}
.notices-filter-bar select {
  cursor: pointer;
  min-width: 150px;
}
.notices-filter-bar select:focus, .notices-filter-bar input:focus {
  border-color: #5149bd;
  box-shadow: 0 0 0 2px rgba(81, 73, 189, 0.1);
}
.notices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}
.notice-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  border-left: 6px solid #5149bd;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.notice-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(81, 73, 189, 0.14);
}
.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
}
.notice-badge-group {
  display: flex;
  gap: 6px;
}
.notice-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}
.badge-category { background: #f0efff; color: #5149bd; }
.badge-priority-high { background: #fff0f3; color: #c0183d; }
.badge-priority-medium { background: #fff5df; color: #b76a00; }
.badge-priority-low { background: #e7f8ed; color: #16733a; }
.notice-card h3 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #17133f;
  font-weight: 700;
}
.notice-date {
  font-size: 12px;
  color: #6b6e86;
  margin-bottom: 12px;
  font-weight: 600;
}
.notice-message-short {
  color: #5c5f78;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 20px;
  flex: 1;
}
.view-notice-btn {
  background: #5149bd;
  color: white;
  border: 0;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  align-self: flex-start;
  transition: background-color 0.2s;
  min-height: 34px;
}
.view-notice-btn:hover {
  background: #453eaa;
}

/* Modal styles */
.notice-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(23, 19, 63, 0.54);
  display: grid;
  place-items: center;
  z-index: 1000;
  padding: 20px;
}
.notice-modal {
  background: white;
  border-radius: 14px;
  width: min(600px, 100%);
  box-shadow: 0 24px 70px rgba(23, 19, 63, 0.32);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalScale 0.3s ease;
}
@keyframes modalScale {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.notice-modal-header {
  padding: 25px;
  border-bottom: 1px solid #e7e5fb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
}
.notice-modal-header h2 {
  margin: 0;
  color: #17133f;
  font-size: 22px;
  font-weight: 700;
}
.close-modal-btn {
  background: #f0efff;
  border: 0;
  color: #5149bd;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
}
.close-modal-btn:hover {
  background: #5149bd;
  color: white;
}
.notice-modal-body {
  padding: 25px;
  overflow-y: auto;
  max-height: 400px;
}
.notice-modal-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.notice-modal-text {
  color: #20223a;
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.notices-empty-state {
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
.notices-empty-state h3 {
  margin: 0 0 8px;
  color: #17133f;
  font-size: 18px;
  font-weight: bold;
}
.notices-empty-state p {
  margin: 0;
  color: #6b6e86;
  font-size: 14px;
  max-width: 320px;
  line-height: 1.5;
}

.notices-error-card {
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
.notices-error-card h2 {
  margin: 0 0 10px;
  color: #17133f;
  font-size: 22px;
}
.notices-error-card p {
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

@media (max-width: 640px) {
  .notices-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
`;

export default StudentNotices;