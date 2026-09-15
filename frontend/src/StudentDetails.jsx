import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";

function InfoRow({ label, value }) {
  return (
    <div className="student-info-row">
      <span>{label}</span>
      <strong>{value || "N/A"}</strong>
    </div>
  );
}

function StudentDetails() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/students/${id}`);
        setStudent(response.data.student);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load student");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  if (loading) {
    return (
      <div className="student-container">
        <div className="student-loading"><span className="dashboard-spinner" /><p>Loading student profile...</p></div>
      </div>
    );
  }

  if (error) return <div className="student-container"><p className="error-message">{error}</p></div>;
  if (!student) return null;

  return (
    <div className="student-container">
      <div className="student-header">
        <div>
          <h1>Student Profile</h1>
          <p className="student-subtitle">Complete student record from MongoDB.</p>
        </div>
        <div className="student-header-actions">
          <Link className="edit-btn" to="/admin/students">Back</Link>
          <Link className="add-btn student-add-link" to={`/admin/students/${id}/edit`}>Edit Student</Link>
        </div>
      </div>

      <div className="student-profile-layout">
        <aside className="student-profile-card">
          {student.profileImage ? <img className="student-profile-photo" src={student.profileImage} alt={student.name} /> : <div className="student-profile-placeholder">{(student.name || "S").charAt(0)}</div>}
          <h2>{student.name || student.user?.name}</h2>
          <p>{student.admissionNumber}</p>
          <span className={`student-status ${(student.status || "Active").toLowerCase()}`}>{student.status || "Active"}</span>
        </aside>

        <div className="student-profile-sections">
          <section>
            <h3>Personal Information</h3>
            <InfoRow label="Student Name" value={student.name || student.user?.name} />
            <InfoRow label="Gender" value={student.gender} />
            <InfoRow label="Date of Birth" value={student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : ""} />
            <InfoRow label="Blood Group" value={student.bloodGroup} />
            <InfoRow label="Phone" value={student.phone} />
            <InfoRow label="Email" value={student.user?.email} />
          </section>

          <section>
            <h3>Academic Information</h3>
            <InfoRow label="Admission Number" value={student.admissionNumber} />
            <InfoRow label="Roll Number" value={student.rollNumber} />
            <InfoRow label="Class" value={student.className} />
            <InfoRow label="Section" value={student.section} />
            <InfoRow label="Username" value={student.user?.username} />
          </section>

          <section>
            <h3>Parent Information</h3>
            <InfoRow label="Father Name" value={student.fatherName} />
            <InfoRow label="Mother Name" value={student.motherName} />
            <InfoRow label="Parent Phone" value={student.parentPhone} />
          </section>

          <section>
            <h3>Address</h3>
            <p className="student-address">{student.address || "N/A"}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default StudentDetails;
