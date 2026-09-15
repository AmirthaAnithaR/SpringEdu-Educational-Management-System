import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";

function InfoRow({ label, value }) {
  return <div className="student-info-row"><span>{label}</span><strong>{value || "N/A"}</strong></div>;
}

function TeacherDetails() {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await axios.get(`/api/teachers/${id}`);
        setTeacher(response.data.teacher);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load teacher");
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [id]);

  if (loading) return <div className="student-container"><div className="student-loading"><span className="dashboard-spinner" /><p>Loading teacher profile...</p></div></div>;
  if (error) return <div className="student-container"><p className="error-message">{error}</p></div>;
  if (!teacher) return null;

  return (
    <div className="student-container">
      <div className="student-header">
        <div><h1>Teacher Profile</h1><p className="student-subtitle">Complete teacher record from MongoDB.</p></div>
        <div className="student-header-actions"><Link className="edit-btn" to="/admin/teachers">Back</Link><Link className="add-btn student-add-link" to={`/admin/teachers/${id}/edit`}>Edit Teacher</Link></div>
      </div>
      <div className="student-profile-layout">
        <aside className="student-profile-card">
          {teacher.photo ? <img className="student-profile-photo" src={teacher.photo} alt={teacher.fullName} /> : <div className="student-profile-placeholder">{(teacher.fullName || "T").charAt(0)}</div>}
          <h2>{teacher.fullName}</h2>
          <p>{teacher.employeeId}</p>
          <span className={`student-status ${teacher.status === "inactive" ? "inactive" : ""}`}>{teacher.status || "active"}</span>
        </aside>
        <div className="student-profile-sections">
          <section><h3>Personal Information</h3><InfoRow label="Name" value={teacher.fullName} /><InfoRow label="Gender" value={teacher.gender} /><InfoRow label="Date of Birth" value={teacher.dateOfBirth?.slice(0, 10)} /><InfoRow label="Blood Group" value={teacher.bloodGroup} /><InfoRow label="Phone" value={teacher.phone} /></section>
          <section><h3>Account Information</h3><InfoRow label="Email" value={teacher.user?.email} /><InfoRow label="Username" value={teacher.user?.username} /><InfoRow label="Role" value={teacher.user?.role} /></section>
          <section><h3>Professional Information</h3><InfoRow label="Department" value={teacher.department} /><InfoRow label="Assigned Subject" value={teacher.subject} /><InfoRow label="Assigned Class" value={teacher.assignedClass} /><InfoRow label="Qualification" value={teacher.qualification} /><InfoRow label="Experience" value={`${teacher.experience || 0} years`} /><InfoRow label="Joining Date" value={teacher.joiningDate?.slice(0, 10)} /></section>
          <section><h3>Address</h3><p className="student-address">{teacher.address || "N/A"}</p></section>
        </div>
      </div>
    </div>
  );
}

export default TeacherDetails;
