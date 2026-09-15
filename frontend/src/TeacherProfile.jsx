import { useEffect, useState } from "react";
import axios from "axios";
import "./TeacherDashboard.css";

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function TeacherProfile() {
  const [teacher, setTeacher] = useState(null);
  const [editForm, setEditForm] = useState({ phone: "", address: "", photo: "" });
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [editing, setEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [message, setMessage] = useState("");

  const userId = getUserId();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`/api/teachers/profile/${userId}`);
      const profile = response.data.teacher;
      setTeacher(profile);
      setEditForm({
        phone: profile.phone || "",
        address: profile.address || "",
        photo: profile.photo || "",
      });
    } catch (err) {
      console.error("Error loading teacher profile:", err);
      setError(err.response?.data?.message || "Unable to load your profile right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchProfile();
    else {
      setError("Unable to find the logged-in teacher. Please log in again.");
      setLoading(false);
    }
  }, []);

  const validateProfile = () => {
    if (!/^[0-9+\-\s()]{7,15}$/.test(editForm.phone.trim())) return "Phone number must be valid.";
    if (!editForm.address.trim()) return "Address cannot be empty.";
    return "";
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setFormError("Profile image should support JPG, PNG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFormError("Profile image maximum upload size is 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEditForm((current) => ({ ...current, photo: reader.result }));
      setFormError("");
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    const validationError = validateProfile();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      setMessage("");
      const response = await axios.put(`/api/teachers/profile/${userId}`, editForm);
      setTeacher(response.data.teacher);
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Error updating teacher profile:", err);
      setFormError(err.response?.data?.message || "Unable to update profile right now.");
    } finally {
      setSaving(false);
    }
  };

  const validatePassword = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) return "All password fields are required.";
    if (passwordForm.newPassword.length < 8) return "New Password length must be at least 8 characters.";
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return "Confirm Password does not match.";
    return "";
  };

  const updatePassword = async () => {
    const validationError = validatePassword();
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordError("");
      setMessage("");
      await axios.put("/api/teachers/change-password", { userId, ...passwordForm });
      setPasswordForm(emptyPasswordForm);
      setShowPasswordModal(false);
      setMessage("Password changed successfully.");
    } catch (err) {
      console.error("Error changing password:", err);
      setPasswordError(err.response?.data?.message || "Unable to change password right now.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setFormError("");
    setEditForm({
      phone: teacher.phone || "",
      address: teacher.address || "",
      photo: teacher.photo || "",
    });
  };

  if (loading) {
    return (
      <div className="teacher-dashboard-page">
        <style>{profileStyles}</style>
        <div className="teacher-dashboard-header"><h1>My Profile</h1></div>
        <ProfileSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-dashboard-page">
        <style>{profileStyles}</style>
        <div className="teacher-dashboard-header"><h1>My Profile</h1></div>
        <div className="teacher-profile-state">
          <h2>Could not load profile</h2>
          <p>{error}</p>
          <button type="button" onClick={fetchProfile}>Retry</button>
        </div>
      </div>
    );
  }

  const photo = editing ? editForm.photo : teacher.photo;
  const initials = getInitials(teacher.fullName);

  return (
    <div className="teacher-dashboard-page">
      <style>{profileStyles}</style>
      <div className="teacher-dashboard-header">
        <h1>My Profile</h1>
      </div>

      {message && <div className="teacher-profile-success">{message}</div>}

      <section className="teacher-profile-hero">
        <div className="teacher-profile-photo">
          {photo ? <img src={photo} alt={teacher.fullName} /> : <span>{initials}</span>}
          {editing && <label className="teacher-photo-upload">Photo<input type="file" accept="image/jpeg,image/png" onChange={handlePhotoChange} /></label>}
        </div>
        <div>
          <h2>{teacher.fullName}</h2>
          <p>{teacher.employeeId}</p>
          <div className="teacher-profile-tags">
            <span>{teacher.department || "Department N/A"}</span>
            <span>{teacher.subject || "Subject N/A"}</span>
            <span>{teacher.assignedClass || "Class N/A"}</span>
            <span className={`teacher-status teacher-status-${teacher.status || "inactive"}`}>{teacher.status || "inactive"}</span>
          </div>
        </div>
      </section>

      {formError && <div className="teacher-profile-error">{formError}</div>}

      <div className="teacher-profile-grid">
        <InfoCard
          title="Personal Information"
          rows={[
            ["Full Name", teacher.fullName],
            ["Gender", teacher.gender],
            ["Date of Birth", formatDate(teacher.dateOfBirth)],
            ["Blood Group", teacher.bloodGroup],
            ["Qualification", teacher.qualification],
            ["Experience", `${teacher.experience || 0} Years`],
            ["Joining Date", formatDate(teacher.joiningDate)],
          ]}
        />

        <div className="teacher-profile-card">
          <h3>Contact Information</h3>
          <ProfileRow label="Email" value={teacher.user?.email} />
          <ProfileRow label="Username" value={teacher.user?.username} />
          <EditableRow label="Phone" value={editForm.phone} displayValue={teacher.phone} editing={editing} onChange={(value) => setEditForm({ ...editForm, phone: value })} />
          <EditableRow label="Address" value={editForm.address} displayValue={teacher.address} editing={editing} textarea onChange={(value) => setEditForm({ ...editForm, address: value })} />
        </div>

        <InfoCard
          title="Professional Information"
          rows={[
            ["Department", teacher.department],
            ["Subject", teacher.subject],
            ["Assigned Class", teacher.assignedClass],
            ["Employee ID", teacher.employeeId],
          ]}
        />
      </div>

      <div className="teacher-profile-actions">
        {editing ? (
          <>
            <button type="button" className="teacher-profile-secondary" onClick={cancelEdit} disabled={saving}>Cancel</button>
            <button type="button" onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setEditing(true)}>Edit Profile</button>
            <button type="button" className="teacher-profile-secondary" onClick={() => setShowPasswordModal(true)}>Change Password</button>
          </>
        )}
      </div>

      {showPasswordModal && (
        <PasswordModal
          form={passwordForm}
          setForm={setPasswordForm}
          error={passwordError}
          saving={passwordSaving}
          close={() => {
            setShowPasswordModal(false);
            setPasswordForm(emptyPasswordForm);
            setPasswordError("");
          }}
          submit={updatePassword}
        />
      )}
    </div>
  );
}

function getUserId() {
  const userVal = localStorage.getItem("user");
  const user = userVal ? JSON.parse(userVal) : null;
  return user?._id || user?.id || "";
}

function InfoCard({ title, rows }) {
  return <div className="teacher-profile-card"><h3>{title}</h3>{rows.map(([label, value]) => <ProfileRow key={label} label={label} value={value} />)}</div>;
}

function ProfileRow({ label, value }) {
  return <div className="teacher-profile-row"><span>{label}</span><strong>{value || "N/A"}</strong></div>;
}

function EditableRow({ label, value, displayValue, editing, onChange, textarea }) {
  return (
    <div className="teacher-profile-row">
      <span>{label}</span>
      {editing ? (
        textarea ? <textarea value={value} onChange={(e) => onChange(e.target.value)} /> : <input value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <strong>{displayValue || "N/A"}</strong>
      )}
    </div>
  );
}

function PasswordModal({ form, setForm, error, saving, close, submit }) {
  return (
    <div className="teacher-profile-modal-backdrop" onClick={close}>
      <div className="teacher-profile-modal" onClick={(event) => event.stopPropagation()}>
        <div className="teacher-profile-modal-head">
          <h2>Change Password</h2>
          <button type="button" onClick={close}>x</button>
        </div>
        <label>Current Password<input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /></label>
        <label>New Password<input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} /></label>
        <label>Confirm Password<input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></label>
        {error && <p className="teacher-profile-error">{error}</p>}
        <button type="button" onClick={submit} disabled={saving}>{saving ? "Updating..." : "Update Password"}</button>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return <div className="teacher-profile-skeleton"><div /><section /><section /><section /></div>;
}

function getInitials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "TP";
}

function formatDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const profileStyles = `
.teacher-profile-hero { display: flex; align-items: center; gap: 22px; padding: 24px; margin-bottom: 22px; background: #ffffff; border: 1px solid #dddafa; border-radius: 16px; box-shadow: 0 12px 28px rgba(81, 73, 189, 0.12); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.teacher-profile-hero:hover, .teacher-profile-card:hover { transform: translateY(-3px); box-shadow: 0 16px 34px rgba(81, 73, 189, 0.16); }
.teacher-profile-photo { position: relative; width: 132px; height: 132px; flex: 0 0 132px; border-radius: 50%; background: #f0efff; border: 4px solid #dddafa; display: grid; place-items: center; overflow: hidden; color: #5149bd; font-size: 34px; font-weight: 900; }
.teacher-profile-photo img { width: 100%; height: 100%; object-fit: cover; }
.teacher-photo-upload { position: absolute; inset: auto 10px 10px; min-height: 30px; display: grid; place-items: center; border-radius: 999px; background: rgba(81, 73, 189, 0.92); color: #ffffff; font-size: 12px; cursor: pointer; }
.teacher-photo-upload input { display: none; }
.teacher-profile-hero h2 { margin: 0 0 6px; color: #17133f; font-size: 30px; }
.teacher-profile-hero p { margin: 0 0 14px; color: #5149bd; font-weight: 900; }
.teacher-profile-tags { display: flex; flex-wrap: wrap; gap: 9px; }
.teacher-profile-tags span { padding: 6px 11px; border-radius: 999px; background: #f0efff; color: #5149bd; font-size: 13px; font-weight: 800; }
.teacher-status-active { background: #eaf8ef !important; color: #16733a !important; }
.teacher-status-inactive { background: #fff0f3 !important; color: #c0183d !important; }
.teacher-profile-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.teacher-profile-card { padding: 20px; background: #ffffff; border: 1px solid #dddafa; border-radius: 12px; box-shadow: 0 12px 28px rgba(81, 73, 189, 0.1); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.teacher-profile-card h3 { margin: 0 0 16px; color: #17133f; font-size: 20px; }
.teacher-profile-row { display: grid; grid-template-columns: 130px 1fr; gap: 12px; padding: 11px 0; border-bottom: 1px solid #eeeef8; color: #20223a; }
.teacher-profile-row:last-child { border-bottom: 0; }
.teacher-profile-row span { color: #5c5f78; font-weight: 800; }
.teacher-profile-row strong { font-weight: 800; overflow-wrap: anywhere; }
.teacher-profile-row input, .teacher-profile-row textarea, .teacher-profile-modal input { width: 100%; min-height: 38px; padding: 8px 10px; border: 1px solid #c8c4ef; border-radius: 6px; background: #ffffff; color: #20223a; box-sizing: border-box; outline: none; font-weight: 700; }
.teacher-profile-row textarea { min-height: 86px; resize: vertical; }
.teacher-profile-row input:focus, .teacher-profile-row textarea:focus, .teacher-profile-modal input:focus { border-color: #5149bd; box-shadow: 0 0 0 2px rgba(81, 73, 189, 0.12); }
.teacher-profile-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
.teacher-profile-secondary { background: #ffffff !important; color: #5149bd !important; border: 1px solid #c8c4ef !important; }
.teacher-main-content button:disabled { opacity: 0.62; cursor: not-allowed; }
.teacher-profile-success, .teacher-profile-error { margin-bottom: 16px; padding: 12px 14px; border-radius: 8px; font-weight: 800; }
.teacher-profile-success { border: 1px solid #cdebd6; background: #f0fbf4; color: #177a3b; }
.teacher-profile-error { border: 1px solid #ffd1dc; background: #fff7f9; color: #c0183d; }
.teacher-profile-state { max-width: 560px; margin: 28px auto; padding: 30px; text-align: center; background: #ffffff; border: 1px solid #dddafa; border-radius: 12px; box-shadow: 0 12px 28px rgba(81, 73, 189, 0.12); }
.teacher-profile-modal-backdrop { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 20px; background: rgba(23, 19, 63, 0.54); }
.teacher-profile-modal { width: min(460px, 100%); display: grid; gap: 13px; padding: 24px; background: #ffffff; border-radius: 10px; box-shadow: 0 24px 70px rgba(23, 19, 63, 0.32); }
.teacher-profile-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid #e7e5fb; }
.teacher-profile-modal-head h2 { margin: 0; color: #17133f; }
.teacher-profile-modal-head button { width: 36px; min-height: 36px; padding: 0; border-radius: 50%; background: #f0efff; color: #5149bd; }
.teacher-profile-modal label { display: grid; gap: 7px; color: #5149bd; font-size: 13px; font-weight: 800; }
.teacher-profile-skeleton { display: grid; gap: 18px; }
.teacher-profile-skeleton div, .teacher-profile-skeleton section { position: relative; overflow: hidden; border-radius: 12px; background: #e8e7f5; }
.teacher-profile-skeleton div { height: 180px; }
.teacher-profile-skeleton section { height: 260px; }
.teacher-profile-skeleton section { display: inline-block; }
@media (min-width: 900px) { .teacher-profile-skeleton { grid-template-columns: repeat(3, 1fr); } .teacher-profile-skeleton div { grid-column: 1 / -1; } }
@media (max-width: 1100px) { .teacher-profile-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 720px) { .teacher-profile-hero { align-items: flex-start; flex-direction: column; } .teacher-profile-grid { grid-template-columns: 1fr; } .teacher-profile-row { grid-template-columns: 1fr; gap: 5px; } }
`;

export default TeacherProfile;
