import { useState } from "react";
import axios from "axios";
import "./AddStudent.css";

function AddStudent({ onStudentAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    admissionNumber: "",
    rollNumber: "",
    gender: "",
    dateOfBirth: "",
    className: "",
    section: "",
    academicYear: "",
    parentName: "",
    parentPhone: "",
    address: "",
    bloodGroup: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        phone: formData.phone || "",
        fatherName: formData.parentName || "",
        motherName: formData.motherName || "",
        profileImage: formData.profileImage || "",
        status: "Active",
      };

      const response = await axios.post(
        "/api/students",
        payload
      );

      if (onStudentAdded) {
        await onStudentAdded();
      }

      alert(response.data.message);
      setFormData({
        name: "",
        email: "",
        username: "",
        password: "",
        admissionNumber: "",
        rollNumber: "",
        gender: "",
        dateOfBirth: "",
        className: "",
        section: "",
        academicYear: "",
        parentName: "",
        parentPhone: "",
        address: "",
        bloodGroup: "",
      });
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Error adding student");
    }
  };

  return (
    <div className="add-student-container">
      <h2 className="add-student-title">Add Student</h2>

      <form className="add-student-form" onSubmit={handleSubmit}>

        <div className="form-group">
          <label>Student Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter Student Name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter Email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            name="username"
            placeholder="Enter Username"
            value={formData.username}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter Password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Admission Number</label>
          <input
            type="text"
            name="admissionNumber"
            placeholder="Enter Admission Number"
            value={formData.admissionNumber}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Roll Number</label>
          <input
            type="text"
            name="rollNumber"
            placeholder="Enter Roll Number"
            value={formData.rollNumber}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Class</label>
          <select
            name="className"
            value={formData.className}
            onChange={handleChange}
          >
            <option value="">Select Class</option>
            {["LKG", "UKG", ...Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`)].map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Section</label>
          <select
            name="section"
            value={formData.section}
            onChange={handleChange}
          >
            <option value="">Select Section</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>

        <div className="form-group">
          <label>Academic Year</label>
          <input
            type="text"
            name="academicYear"
            placeholder="2026-2027"
            value={formData.academicYear}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Parent Name</label>
          <input
            type="text"
            name="parentName"
            placeholder="Enter Parent Name"
            value={formData.parentName}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Parent Phone</label>
          <input
            type="text"
            name="parentPhone"
            placeholder="Enter Parent Phone"
            value={formData.parentPhone}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Blood Group</label>
          <input
            type="text"
            name="bloodGroup"
            placeholder="O+, A+, B+, AB+"
            value={formData.bloodGroup}
            onChange={handleChange}
          />
        </div>

        <div className="form-group full-width">
          <label>Address</label>
          <textarea
            name="address"
            placeholder="Enter Address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <button className="submit-btn" type="submit">
          Add Student
        </button>

      </form>
    </div>
  );
}

export default AddStudent;