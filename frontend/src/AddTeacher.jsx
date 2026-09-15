import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const defaultClassOptions = ["LKG", "UKG", ...Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`)];
const defaultSectionOptions = ["A", "B", "C", "D", "E", "F"];

const initialState = {
  name: "",
  email: "",
  username: "",
  password: "",
  teacherId: "",
  gender: "",
  dateOfBirth: "",
  subject: "",
  className: "",
  section: "",
  assignedClass: "",
  qualification: "",
  experience: "",
  joiningDate: "",
  phone: "",
  address: "",
  bloodGroup: "",
  photo: "",
  status: "active",
};

const compareClassNames = (a, b) => {
  if (!a || !b) return false;
  const clean = (str) => String(str).trim().toLowerCase().replace(/\s+/g, ' ');
  return clean(a) === clean(b);
};

function AddTeacher() {
  const [formData, setFormData] = useState(initialState);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOptions = async () => {
      setClassesLoading(true);
      setSubjectsLoading(true);
      setSubjectsError(false);
      try {
        const classRes = await axios.get("/api/classes");
        setClasses(classRes.data.classes || []);
      } catch (error) {
        setToast(error.response?.data?.message || "Failed to load class options");
      } finally {
        setClassesLoading(false);
      }

      try {
        const subjectRes = await axios.get("/api/subjects");
        setSubjects(subjectRes.data.subjects || []);
      } catch (error) {
        setSubjectsError(true);
        setToast(error.response?.data?.message || "Failed to load subject options");
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const classOptions = ["LKG", "UKG", ...Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`)];

  const sectionOptions = useMemo(() => {
    if (!formData.className) return [];
    return [
      ...new Set(
        classes
          .filter((item) => compareClassNames(item.className, formData.className))
          .map((item) => item.section)
          .filter(Boolean)
      ),
    ].sort();
  }, [classes, formData.className]);

  const subjectOptions = useMemo(() => {
    if (!formData.className || !formData.section) return [];
    const assignedNames = [
      ...new Set(
        classes
          .filter(
            (item) =>
              compareClassNames(item.className, formData.className) &&
              item.section &&
              item.section.trim().toLowerCase() === formData.section.trim().toLowerCase()
          )
          .map((item) => item.subject)
          .filter(Boolean)
      ),
    ].sort();

    return assignedNames.map((name) => {
      const match = subjects.find((s) => s.subjectName === name);
      return {
        value: name,
        label: match && match.subjectCode ? `${name} (${match.subjectCode})` : name,
      };
    });
  }, [classes, subjects, formData.className, formData.section]);

  const subjectPlaceholder = useMemo(() => {
    if (subjectsLoading) return "Loading subjects...";
    if (subjectsError) return "Error loading subjects";
    if (!formData.className || !formData.section) return "Select Class and Section First";
    if (subjectOptions.length === 0) return "No subjects assigned to this class and section";
    return "Select Subject";
  }, [subjectsLoading, subjectsError, formData.className, formData.section, subjectOptions]);

  const validate = () => {
    const required = ["name", "email", "username", "password", "teacherId", "gender", "className", "section", "subject", "qualification", "phone"];
    const nextErrors = {};
    required.forEach((field) => {
      if (!String(formData[field] || "").trim()) nextErrors[field] = "Required";
    });
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) nextErrors.email = "Enter a valid email";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
      ...(name === "className" ? { section: "", subject: "" } : {}),
    });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData((current) => ({ ...current, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setToast("Please fix validation errors");
      return;
    }

    try {
      setSaving(true);
      await axios.post("/api/teachers", {
        ...formData,
        assignedClass: `${formData.className} - ${formData.section}`,
        experience: Number(formData.experience) || 0,
      });
      setToast("Teacher added successfully");
      setTimeout(() => navigate("/admin/teachers"), 800);
    } catch (error) {
      setToast(error.response?.data?.message || "Error adding teacher");
    } finally {
      setSaving(false);
    }
  };

  const input = (name, label, type = "text") => (
    <div className="form-group">
      <label>{label}</label>
      <input className={errors[name] ? "field-error" : ""} type={type} name={name} value={formData[name]} onChange={handleChange} />
      {errors[name] && <small className="validation-error">{errors[name]}</small>}
    </div>
  );

  const select = (name, label, placeholder, options, disabled = false) => (
    <div className="form-group">
      <label>{label}</label>
      <select className={errors[name] ? "field-error" : ""} name={name} value={formData[name]} onChange={handleChange} disabled={disabled}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
      {errors[name] && <small className="validation-error">{errors[name]}</small>}
    </div>
  );

  return (
    <div className="add-student-container">
      {toast && <div className="toast-message">{toast}</div>}
      <div className="student-form-header">
        <h2>Add Teacher</h2>
        <Link className="edit-btn" to="/admin/teachers">Back</Link>
      </div>
      <form className="add-student-form" onSubmit={handleSubmit}>
        {input("name", "Teacher Name")}
        {input("email", "Email", "email")}
        {input("username", "Username")}
        {input("password", "Password", "password")}
        {input("teacherId", "Teacher ID")}
        <div className="form-group"><label>Gender</label><select className={errors.gender ? "field-error" : ""} name="gender" value={formData.gender} onChange={handleChange}><option value="">Select Gender</option><option>Male</option><option>Female</option><option>Other</option></select>{errors.gender && <small className="validation-error">{errors.gender}</small>}</div>
        {input("dateOfBirth", "Date of Birth", "date")}
        {select("className", "Class", classesLoading ? "Loading classes..." : "Select Class", classOptions, classesLoading)}
        {select("section", "Section", "Select Section", sectionOptions, !formData.className)}
        {select(
          "subject",
          "Assign Subject",
          subjectPlaceholder,
          subjectOptions,
          subjectsLoading || subjectsError || !formData.className || !formData.section || subjectOptions.length === 0
        )}
        {input("qualification", "Qualification")}
        {input("experience", "Experience (years)", "number")}
        {input("joiningDate", "Joining Date", "date")}
        {input("phone", "Phone Number")}
        {input("bloodGroup", "Blood Group")}
        <div className="form-group"><label>Teacher Status</label><select name="status" value={formData.status} onChange={handleChange}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        <div className="form-group"><label>Photo Upload</label><input type="file" accept="image/*" onChange={handlePhotoUpload} />{formData.photo && <img className="teacher-photo-preview" src={formData.photo} alt="Preview" />}</div>
        {input("photo", "Photo URL")}
        <div className="form-group full-width"><label>Address</label><textarea name="address" value={formData.address} onChange={handleChange} /></div>
        <button type="submit" className="submit-btn" disabled={saving}>{saving ? "Saving..." : "Add Teacher"}</button>
      </form>
    </div>
  );
}

export default AddTeacher;
