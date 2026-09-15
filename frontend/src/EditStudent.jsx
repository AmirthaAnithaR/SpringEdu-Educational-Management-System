import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./AddStudent.css";

const initialState = {
  name: "",
  email: "",
  username: "",
  admissionNumber: "",
  rollNumber: "",
  gender: "",
  dateOfBirth: "",
  className: "",
  section: "",
  parentPhone: "",
  address: "",
  bloodGroup: "",
  phone: "",
  fatherName: "",
  motherName: "",
  profileImage: "",
  status: "Active",
};

const requiredFields = ["name", "email", "username", "admissionNumber", "rollNumber", "gender", "dateOfBirth", "className", "section", "parentPhone", "address"];

function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState("");

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/students/${id}`);
        const student = response.data.student;
        setFormData({
          ...initialState,
          name: student.name || student.user?.name || "",
          email: student.user?.email || "",
          username: student.user?.username || "",
          admissionNumber: student.admissionNumber || "",
          rollNumber: student.rollNumber || "",
          gender: student.gender || "",
          dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : "",
          className: student.className || "",
          section: student.section || "",
          parentPhone: student.parentPhone || "",
          address: student.address || "",
          bloodGroup: student.bloodGroup || "",
          phone: student.phone || "",
          fatherName: student.fatherName || "",
          motherName: student.motherName || "",
          profileImage: student.profileImage || "",
          status: student.status || "Active",
        });
      } catch (error) {
        setToast(error.response?.data?.message || "Failed to load student");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  const validate = () => {
    const nextErrors = {};
    requiredFields.forEach((field) => {
      if (!String(formData[field] || "").trim()) {
        nextErrors[field] = "Required";
      }
    });
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      nextErrors.email = "Enter a valid email";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setToast("Please fix validation errors");
      return;
    }

    try {
      setSaving(true);
      await axios.put(`/api/students/${id}`, formData);
      setToast("Student updated successfully");
      setTimeout(() => navigate("/admin/students"), 800);
    } catch (error) {
      setToast(error.response?.data?.message || "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (name, label, type = "text") => (
    <div className="form-group">
      <label>{label}</label>
      <input className={errors[name] ? "field-error" : ""} type={type} name={name} value={formData[name]} onChange={handleChange} />
      {errors[name] && <small className="validation-error">{errors[name]}</small>}
    </div>
  );

  if (loading) {
    return <div className="student-container"><div className="student-loading"><span className="dashboard-spinner" /><p>Loading student data...</p></div></div>;
  }

  return (
    <div className="add-student-container">
      {toast && <div className="toast-message">{toast}</div>}
      <div className="student-form-header">
        <h2 className="add-student-title">Edit Student</h2>
        <Link className="edit-btn" to="/admin/students">Back</Link>
      </div>

      <form className="add-student-form" onSubmit={handleSubmit}>
        {renderInput("name", "Student Name")}
        {renderInput("email", "Email", "email")}
        {renderInput("username", "Username")}
        {renderInput("admissionNumber", "Admission Number")}
        {renderInput("rollNumber", "Roll Number")}
        {renderInput("dateOfBirth", "Date of Birth", "date")}
        {renderInput("phone", "Phone")}
        {renderInput("fatherName", "Father Name")}
        {renderInput("motherName", "Mother Name")}
        {renderInput("parentPhone", "Parent Phone")}
        {renderInput("bloodGroup", "Blood Group")}
        {renderInput("profileImage", "Profile Image URL")}

        <div className="form-group">
          <label>Gender</label>
          <select className={errors.gender ? "field-error" : ""} name="gender" value={formData.gender} onChange={handleChange}>
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          {errors.gender && <small className="validation-error">{errors.gender}</small>}
        </div>

        <div className="form-group">
          <label>Class</label>
          <select className={errors.className ? "field-error" : ""} name="className" value={formData.className} onChange={handleChange}>
            <option value="">Select Class</option>
            {["LKG", "UKG", ...Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`)].map((className) => <option key={className}>{className}</option>)}
          </select>
          {errors.className && <small className="validation-error">{errors.className}</small>}
        </div>

        <div className="form-group">
          <label>Section</label>
          <select className={errors.section ? "field-error" : ""} name="section" value={formData.section} onChange={handleChange}>
            <option value="">Select Section</option>
            {["A", "B", "C", "D"].map((section) => <option key={section}>{section}</option>)}
          </select>
          {errors.section && <small className="validation-error">{errors.section}</small>}
        </div>

        <div className="form-group">
          <label>Status</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        <div className="form-group full-width">
          <label>Address</label>
          <textarea className={errors.address ? "field-error" : ""} name="address" value={formData.address} onChange={handleChange} />
          {errors.address && <small className="validation-error">{errors.address}</small>}
        </div>

        <button className="submit-btn" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
      </form>
    </div>
  );
}

export default EditStudent;
