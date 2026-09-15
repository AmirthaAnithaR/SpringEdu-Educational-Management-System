import { useEffect, useState } from "react";
import axios from "axios";
import "./StudentProfile.css";

function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit fields state
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");
  const [profileUpdating, setProfileUpdating] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSuccessMsg, setPwSuccessMsg] = useState("");
  const [pwErrorMsg, setPwErrorMsg] = useState("");
  const [pwUpdating, setPwUpdating] = useState(false);

  const getUserId = () => {
    const userVal = localStorage.getItem("user");
    const user = userVal ? JSON.parse(userVal) : null;
    return user?._id || user?.id || "";
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const userId = getUserId();
      if (!userId) {
        setError("Unable to identify logged-in student. Please log in again.");
        return;
      }
      const response = await axios.get(`/api/students/profile/${userId}`);
      const studentData = response.data.student || {};
      setStudent(studentData);
      
      // Initialize form fields
      setPhone(studentData.phone || "");
      setAddress(studentData.address || "");
      setProfilePhoto(studentData.profilePhoto || "");
    } catch (err) {
      console.error("Error fetching student profile:", err);
      setError(err.response?.data?.message || "Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    if (!phone.trim()) {
      setProfileErrorMsg("Phone number is required");
      return;
    }
    if (!address.trim()) {
      setProfileErrorMsg("Address is required");
      return;
    }

    try {
      setProfileUpdating(true);
      const userId = getUserId();
      const response = await axios.put(`/api/students/profile/${userId}`, {
        phone,
        address,
        profilePhoto,
      });
      setProfileSuccessMsg(response.data.message || "Profile updated successfully!");
      // Update local student object fields
      setStudent((prev) => ({
        ...prev,
        phone,
        address,
        profilePhoto,
      }));
    } catch (err) {
      console.error("Error updating student profile:", err);
      setProfileErrorMsg(err.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwSuccessMsg("");
    setPwErrorMsg("");

    if (!currentPassword) {
      setPwErrorMsg("Current password is required");
      return;
    }
    if (newPassword.length < 6) {
      setPwErrorMsg("New password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErrorMsg("New password and confirm password do not match");
      return;
    }

    try {
      setPwUpdating(true);
      const userId = getUserId();
      const response = await axios.put("/api/students/change-password", {
        userId,
        currentPassword,
        newPassword,
      });

      setPwSuccessMsg(response.data.message || "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Error changing password:", err);
      setPwErrorMsg(err.response?.data?.message || "Failed to change password. Please try again.");
    } finally {
      setPwUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="student-profile-container">
        <style>{profileStyles}</style>
        <SkeletonProfile />
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-profile-container">
        <style>{profileStyles}</style>
        <div className="profile-error-card">
          <div className="error-icon">⚠️</div>
          <h2>Failed to Load Profile</h2>
          <p>{error}</p>
          <button type="button" className="retry-btn" onClick={fetchProfile}>Retry</button>
        </div>
      </div>
    );
  }

  const getInitials = (name = "") => {
    return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "ST";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="student-profile-container">
      <style>{profileStyles}</style>

      <h1>My Profile</h1>

      <div className="profile-layout">
        {/* Left Side: General Profile Card (Read Only) */}
        <div className="profile-card-left">
          <div className="profile-card-avatar">
            {student.profilePhoto ? (
              <img src={student.profilePhoto} alt={student.fullName} />
            ) : (
              <span>{getInitials(student.fullName)}</span>
            )}
          </div>
          <h2>{student.fullName}</h2>
          <span className="profile-role-badge">Student</span>

          <div className="profile-details-list">
            <div className="profile-detail-row">
              <span>Admission Number</span>
              <span>{student.admissionNumber}</span>
            </div>
            <div className="profile-detail-row">
              <span>Roll Number</span>
              <span>{student.rollNumber}</span>
            </div>
            <div className="profile-detail-row">
              <span>Class & Section</span>
              <span>Class {student.class} - {student.section}</span>
            </div>
            <div className="profile-detail-row">
              <span>Academic Year</span>
              <span>{student.academicYear}</span>
            </div>
            <div className="profile-detail-row">
              <span>Email Address</span>
              <span>{student.email}</span>
            </div>
            <div className="profile-detail-row">
              <span>Gender</span>
              <span>{student.gender}</span>
            </div>
            <div className="profile-detail-row">
              <span>Blood Group</span>
              <span>{student.bloodGroup || "Not Provided"}</span>
            </div>
            <div className="profile-detail-row">
              <span>Date Of Birth</span>
              <span>{formatDate(student.dateOfBirth)}</span>
            </div>
            <div className="profile-detail-row">
              <span>Parent's Name</span>
              <span>{student.parentName || "N/A"}</span>
            </div>
            <div className="profile-detail-row">
              <span>Parent's Phone</span>
              <span>{student.parentPhone}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Edit Profile and Change Password */}
        <div className="profile-card-right">
          {/* Edit Form */}
          <h4 className="profile-section-title">Edit Profile Details</h4>
          {profileSuccessMsg && <div className="alert-success">{profileSuccessMsg}</div>}
          {profileErrorMsg && <div className="alert-error">{profileErrorMsg}</div>}

          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="profile-form-group">
              <label htmlFor="profilePhone">Phone Number</label>
              <input
                id="profilePhone"
                type="text"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="profileAddress">Residential Address</label>
              <textarea
                id="profileAddress"
                rows="3"
                placeholder="Enter permanent address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="profilePhotoUrl">Profile Picture URL</label>
              <input
                id="profilePhotoUrl"
                type="text"
                placeholder="Enter image URL link"
                value={profilePhoto}
                onChange={(e) => setProfilePhoto(e.target.value)}
              />
            </div>

            <button type="submit" className="save-profile-btn" disabled={profileUpdating}>
              {profileUpdating ? "Saving..." : "Save Changes"}
            </button>
          </form>

          {/* Change Password Form */}
          <h4 className="profile-section-title">Change Password</h4>
          {pwSuccessMsg && <div className="alert-success">{pwSuccessMsg}</div>}
          {pwErrorMsg && <div className="alert-error">{pwErrorMsg}</div>}

          <form onSubmit={handleChangePassword} className="profile-form">
            <div className="profile-form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="change-pw-btn" disabled={pwUpdating}>
              {pwUpdating ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SkeletonProfile() {
  return (
    <>
      <div className="student-skeleton" style={{ width: "200px", height: "36px", marginBottom: "25px" }} />
      <div className="profile-layout">
        <div className="student-skeleton" style={{ height: "550px", borderRadius: "14px" }} />
        <div className="student-skeleton" style={{ height: "650px", borderRadius: "14px" }} />
      </div>
    </>
  );
}

const profileStyles = `
.profile-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  align-items: start;
}
.profile-card-left, .profile-card-right {
  background: white;
  padding: 30px;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}
.profile-card-left {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.profile-card-avatar {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  overflow: hidden;
  background: #f4f3ff;
  border: 4px solid #dddafa;
  margin-bottom: 20px;
  display: grid;
  place-items: center;
  font-size: 40px;
  font-weight: 800;
  color: #5149bd;
}
.profile-card-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.profile-card-left h2 {
  margin: 0 0 6px;
  color: #17133f;
  font-size: 24px;
  font-weight: 700;
}
.profile-role-badge {
  background: #f0efff;
  color: #5149bd;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 25px;
}
.profile-details-list {
  width: 100%;
  display: grid;
  gap: 12px;
}
.profile-detail-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #eeeef8;
  padding: 8px 0;
  font-size: 14px;
}
.profile-detail-row span:first-child {
  color: #5c5f78;
  font-weight: 600;
}
.profile-detail-row span:last-child {
  color: #20223a;
  font-weight: 700;
}
.profile-section-title {
  font-size: 18px;
  color: #17133f;
  margin: 0 0 20px;
  font-weight: 700;
  border-bottom: 2px solid #f0efff;
  padding-bottom: 8px;
}
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 35px;
}
.profile-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.profile-form-group label {
  font-size: 13px;
  font-weight: 700;
  color: #5c5f78;
}
.profile-form-group input, .profile-form-group textarea {
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid #c8c4ef;
  color: #20223a;
  outline: none;
  font-size: 14px;
  font-weight: 600;
  background: white;
}
.profile-form-group textarea {
  resize: vertical;
}
.profile-form-group input:focus, .profile-form-group textarea:focus {
  border-color: #5149bd;
  box-shadow: 0 0 0 2px rgba(81, 73, 189, 0.1);
}
.save-profile-btn, .change-pw-btn {
  background: #5149bd;
  color: white;
  border: 0;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  align-self: flex-start;
  transition: background-color 0.2s;
  min-height: 38px;
}
.save-profile-btn:hover, .change-pw-btn:hover {
  background: #453eaa;
}
.save-profile-btn:disabled, .change-pw-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.alert-success {
  background: #e7f8ed;
  color: #16733a;
  border: 1px solid #c3edd3;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 15px;
  font-weight: 600;
}
.alert-error {
  background: #fff0f3;
  color: #c0183d;
  border: 1px solid #fed1d9;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 15px;
  font-weight: 600;
}

.profile-error-card {
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
.profile-error-card h2 {
  margin: 0 0 10px;
  color: #17133f;
  font-size: 22px;
}
.profile-error-card p {
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

@media (max-width: 900px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }
}
`;

export default StudentProfile;