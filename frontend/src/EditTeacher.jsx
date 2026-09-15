import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";

const initialState = {
  name: "", email: "", username: "", teacherId: "", gender: "", dateOfBirth: "", department: "",
  subject: "", className: "", section: "", qualification: "", experience: "", joiningDate: "", phone: "",
  address: "", bloodGroup: "", photo: "", status: "active",
};

function EditTeacher() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialState);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const fetchTeacher = async () => {
      setSubjectsLoading(true);
      setSubjectsError(false);
      setClassesLoading(true);
      try {
        const [response, subjectRes, classRes] = await Promise.all([
          axios.get(`/api/teachers/${id}`),
          axios.get("/api/subjects"),
          axios.get("/api/classes"),
        ]);
        const teacher = response.data.teacher;
        setSubjects(subjectRes.data.subjects || []);
        const loadedClasses = classRes.data.classes || [];
        setClasses(loadedClasses);

        let className = "";
        let section = "";
        if (teacher.assignedClass) {
          const parts = teacher.assignedClass.split(" - ");
          if (parts.length === 2) {
            className = parts[0].trim();
            section = parts[1].trim();
          } else {
            const fallbackParts = teacher.assignedClass.split("-");
            if (fallbackParts.length === 2) {
              className = fallbackParts[0].trim();
              section = fallbackParts[1].trim();
            } else {
              className = teacher.assignedClass;
            }
          }
        }

        setFormData({
          ...initialState,
          name: teacher.fullName || teacher.user?.name || "",
          email: teacher.user?.email || "",
          username: teacher.user?.username || "",
          teacherId: teacher.employeeId || "",
          gender: teacher.gender || "",
          dateOfBirth: teacher.dateOfBirth ? teacher.dateOfBirth.slice(0, 10) : "",
          department: teacher.department || "",
          subject: teacher.subject || "",
          className,
          section,
          qualification: teacher.qualification || "",
          experience: teacher.experience || "",
          joiningDate: teacher.joiningDate ? teacher.joiningDate.slice(0, 10) : "",
          phone: teacher.phone || "",
          address: teacher.address || "",
          bloodGroup: teacher.bloodGroup || "",
          photo: teacher.photo || "",
          status: teacher.status || "active",
        });
      } catch (error) {
        setSubjectsError(true);
        setToast(error.response?.data?.message || "Failed to load teacher");
      } finally {
        setSubjectsLoading(false);
        setClassesLoading(false);
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [id]);

  const classOptions = useMemo(() => {
    return [...new Set(classes.map((item) => item.className).filter(Boolean))].sort((a, b) => {
      const matchA = a.match(/\d+/);
      const matchB = b.match(/\d+/);
      if (matchA && matchB) {
        return Number(matchA[0]) - Number(matchB[0]);
      }
      return a.localeCompare(b);
    });
  }, [classes]);

  const sectionOptions = useMemo(() => {
    if (!formData.className) return [];
    return [
      ...new Set(
        classes
          .filter((item) => item.className === formData.className)
          .map((item) => item.section)
          .filter(Boolean)
      ),
    ].sort();
  }, [classes, formData.className]);

  const subjectOptions = useMemo(() => {
    if (!formData.className) return [];
    const assignedNames = [
      ...new Set(
        classes
          .filter((item) => item.className === formData.className)
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
  }, [classes, subjects, formData.className]);

  const subjectPlaceholder = useMemo(() => {
    if (subjectsLoading) return "Loading subjects...";
    if (subjectsError) return "Error loading subjects";
    if (!formData.className) return "Select Class First";
    if (subjectOptions.length === 0) return "No subjects assigned to this class";
    return "Select Subject";
  }, [subjectsLoading, subjectsError, formData.className, subjectOptions]);

  const validate = () => {
    const required = ["name", "email", "username", "teacherId", "gender", "className", "section", "subject", "qualification", "phone"];
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "className" ? { section: "", subject: "" } : {}),
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
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
      await axios.put(`/api/teachers/${id}`, {
        ...formData,
        assignedClass: `${formData.className} - ${formData.section}`,
        experience: Number(formData.experience) || 0,
      });
      setToast("Teacher updated successfully");
      setTimeout(() => navigate("/admin/teachers"), 800);
    } catch (error) {
      setToast(error.response?.data?.message || "Failed to update teacher");
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



  if (loading) return <div className="student-container"><div className="student-loading"><span className="dashboard-spinner" /><p>Loading teacher data...</p></div></div>;

  return (
    <div className="add-student-container">
      {toast && <div className="toast-message">{toast}</div>}
      <div className="student-form-header"><h2>Edit Teacher</h2><Link className="edit-btn" to="/admin/teachers">Back</Link></div>
      <form className="add-student-form" onSubmit={handleSubmit}>
        {input("name", "Teacher Name")}
        {input("email", "Email", "email")}
        {input("username", "Username")}
        {input("teacherId", "Teacher ID")}
        <div className="form-group"><label>Gender</label><select className={errors.gender ? "field-error" : ""} name="gender" value={formData.gender} onChange={handleChange}><option value="">Select Gender</option><option>Male</option><option>Female</option><option>Other</option></select>{errors.gender && <small className="validation-error">{errors.gender}</small>}</div>
        {input("dateOfBirth", "Date of Birth", "date")}
        {input("department", "Department")}
        {select(
          "subject",
          "Assign Subject",
          subjectPlaceholder,
          subjectOptions,
          subjectsLoading || subjectsError || !formData.className || subjectOptions.length === 0
        )}
        {select("className", "Class", classesLoading ? "Loading classes..." : "Select Class", classOptions, classesLoading)}
        {select("section", "Section", "Select Section", sectionOptions, !formData.className)}
        {input("qualification", "Qualification")}
        {input("experience", "Experience (years)", "number")}
        {input("joiningDate", "Joining Date", "date")}
        {input("phone", "Phone Number")}
        {input("bloodGroup", "Blood Group")}
        <div className="form-group"><label>Teacher Status</label><select name="status" value={formData.status} onChange={handleChange}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        <div className="form-group"><label>Photo Upload</label><input type="file" accept="image/*" onChange={handlePhotoUpload} />{formData.photo && <img className="teacher-photo-preview" src={formData.photo} alt="Preview" />}</div>
        {input("photo", "Photo URL")}
        <div className="form-group full-width"><label>Address</label><textarea name="address" value={formData.address} onChange={handleChange} /></div>
        <button className="submit-btn" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
      </form>
    </div>
  );
}

export default EditTeacher;
