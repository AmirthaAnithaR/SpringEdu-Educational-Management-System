import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaBookOpen,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaInfoCircle,
  FaLayerGroup,
  FaSignal,
  FaUserGraduate,
  FaUsers,
} from "react-icons/fa";
import "./TeacherDashboard.css";

function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getUserId = () => {
    const userVal = localStorage.getItem("user");
    const user = userVal ? JSON.parse(userVal) : null;
    return user?._id || user?.id || "";
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError("");

      const userId = getUserId();

      if (!userId) {
        setClasses([]);
        setError("Unable to find the logged-in teacher. Please log in again.");
        return;
      }

      const response = await axios.get(`/api/classes/teacher/${userId}`);
      setClasses(response.data.classes || []);
    } catch (err) {
      console.error("Error loading teacher classes:", err);
      setError(err.response?.data?.message || "Unable to load your assigned classes right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const teacherName = (cls) => cls.classTeacher?.fullName || "Not Assigned";
  const statusText = (status) => (status ? status.charAt(0).toUpperCase() + status.slice(1) : "Inactive");

  const classFields = (cls) => [
    { icon: <FaLayerGroup />, label: "Section", value: cls.section || "N/A" },
    { icon: <FaBookOpen />, label: "Subject", value: cls.subject || "N/A" },
    { icon: <FaUsers />, label: "Total Students", value: cls.totalStudents ?? 0 },
    { icon: <FaCalendarAlt />, label: "Academic Year", value: cls.academicYear || "N/A" },
    { icon: <FaChalkboardTeacher />, label: "Class Teacher", value: teacherName(cls) },
    { icon: <FaSignal />, label: "Status", value: statusText(cls.status), status: cls.status },
  ];

  return (
    <div className="teacher-dashboard-page teacher-classes-page">
      <div className="teacher-dashboard-header">
        <h1>My Classes</h1>
      </div>

      {loading && (
        <div className="teacher-classes-container">
          {[1, 2, 3].map((item) => (
            <div key={item} className="class-card class-card-skeleton">
              <div className="skeleton-title" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-button" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="teacher-classes-state teacher-classes-error">
          <FaInfoCircle />
          <h2>Could not load classes</h2>
          <p>{error}</p>
          <button type="button" onClick={fetchClasses}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && classes.length === 0 && (
        <div className="teacher-classes-state teacher-classes-empty">
          <div className="empty-illustration">📚</div>
          <h2>No Classes Assigned</h2>
          <p>You have not been assigned any classes by the administrator yet.</p>
        </div>
      )}

      {!loading && !error && classes.length > 0 && (
        <div className="teacher-classes-container">
          {classes.map((cls) => (
            <div key={cls._id} className="class-card teacher-class-card">
              <h2>{cls.className || "Class"}</h2>

              <div className="class-info">
                {classFields(cls).map((field) => (
                  <p key={field.label}>
                    <span className="class-field-icon">{field.icon}</span>
                    <strong>{field.label}:</strong>
                    <span className={field.label === "Status" ? `status-pill status-${field.status || "inactive"}` : ""}>
                      {field.value}
                    </span>
                  </p>
                ))}
              </div>

              <button type="button" className="view-btn" onClick={() => setSelectedClass(cls)}>
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedClass && (
        <div className="teacher-class-modal-backdrop" role="presentation" onClick={() => setSelectedClass(null)}>
          <div className="teacher-class-modal" role="dialog" aria-modal="true" aria-labelledby="class-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="teacher-class-modal-header">
              <h2 id="class-modal-title">{selectedClass.className || "Class Details"}</h2>
              <button type="button" className="modal-close-icon" aria-label="Close modal" onClick={() => setSelectedClass(null)}>
                x
              </button>
            </div>

            <div className="teacher-class-modal-grid">
              {classFields(selectedClass).map((field) => (
                <div key={field.label} className="teacher-class-modal-row">
                  <span className="class-field-icon">{field.icon}</span>
                  <div>
                    <strong>{field.label}</strong>
                    <p>{field.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="modal-close-btn" onClick={() => setSelectedClass(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherClasses;
