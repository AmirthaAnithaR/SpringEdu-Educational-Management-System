import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const classOptions = ["LKG", "UKG", ...Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`)];
const sectionOptions = ["A", "B", "C", "D", "E", "F"];
const academicYearOptions = ["2025-2026", "2026-2027", "2027-2028", "2028-2029", "2029-2030"];
const emptyForm = { className: "", section: "", classTeacher: "", subject: "", academicYear: "", status: "active" };

function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState("");
  const [deleteId, setDeleteId] = useState("");

  const fetchData = async () => {
    setSubjectsLoading(true);
    setSubjectsError(false);
    try {
      const [classRes, teacherRes, subjectRes] = await Promise.all([
        axios.get("/api/classes"),
        axios.get("/api/teachers"),
        axios.get("/api/subjects"),
      ]);
      setClasses(classRes.data.classes || []);
      setTeachers(teacherRes.data.teachers || []);
      setSubjects(subjectRes.data.subjects || []);
    } catch (error) {
      setSubjectsError(true);
      setToast(error.response?.data?.message || "Failed to load class data");
    } finally {
      setSubjectsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const saveClass = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        className: form.className,
        section: form.section,
        classTeacher: form.classTeacher,
        subject: form.subject,
        academicYear: form.academicYear,
        status: form.status,
      };

      if (editingId) await axios.put(`/api/classes/${editingId}`, payload);
      else await axios.post("/api/classes", payload);
      setToast(editingId ? "Class updated successfully" : "Class added successfully");
      setForm(emptyForm);
      setEditingId("");
      fetchData();
    } catch (error) {
      setToast(error.response?.data?.message || "Failed to save class");
    }
  };

  const editClass = (item) => {
    setEditingId(item._id);
    setForm({ ...emptyForm, ...item, classTeacher: item.classTeacher?._id || item.classTeacher || "" });
  };

  const deleteClass = async () => {
    await axios.delete(`/api/classes/${deleteId}`);
    setToast("Class deleted successfully");
    setDeleteId("");
    fetchData();
  };

  const filteredClasses = classes.filter((item) =>
    [item.className, item.section, item.classTeacher?.fullName].join(" ").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="class-container">
      {toast && <div className="toast-message">{toast}</div>}
      <div className="class-header">
        <h1>Class Management</h1>
        <input type="text" placeholder="Search class..." className="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      <form className="inline-form" onSubmit={saveClass}>
        <select value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} required>
          <option value="">Class Name</option>
          {classOptions.map((className) => <option key={className} value={className}>{className}</option>)}
        </select>
        <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} required>
          <option value="">Section</option>
          {sectionOptions.map((section) => <option key={section} value={section}>{section}</option>)}
        </select>
        <select value={form.classTeacher} onChange={(e) => setForm({ ...form, classTeacher: e.target.value })} disabled={teachers.length === 0} required>
          <option value="">{teachers.length === 0 ? "No teachers available" : "Class Teacher"}</option>
          {teachers.map((t) => <option key={t._id} value={t._id}>{t.employeeId ? `${t.fullName} (${t.employeeId})` : t.fullName}</option>)}
        </select>
        <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} disabled={subjectsLoading || subjectsError || subjects.length === 0} required>
          <option value="">{subjectsLoading ? "Loading subjects..." : subjectsError || subjects.length === 0 ? "No subjects available" : "Subject"}</option>
          {subjects.map((subject) => <option key={subject._id} value={subject.subjectName}>{subject.subjectName}</option>)}
        </select>
        <select value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} required>
          <option value="">Academic Year</option>
          {academicYearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
        <button className="add-btn" type="submit">{editingId ? "Update Class" : "Add Class"}</button>
      </form>
      <div className="table-container">
        <table className="admin-table">
          <thead><tr><th>Class Name</th><th>Section</th><th>Class Teacher</th><th>No. of Students</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredClasses.map((item) => (
              <tr key={item._id}>
                <td>{item.className}</td><td>{item.section}</td><td>{item.classTeacher?.fullName || "N/A"}</td><td>{item.totalStudents || 0}</td><td>{item.status}</td>
                <td><button className="edit-btn" onClick={() => alert(item.description || "No description")}>View</button><button className="edit-btn" onClick={() => editClass(item)}>Edit</button><button className="delete-btn" onClick={() => setDeleteId(item._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredClasses.length === 0 && <div className="empty-state"><div className="empty-icon">🏫</div><h2>No classes found</h2><p>Add a class to start organizing students.</p></div>}
      </div>
      {deleteId && <div className="modal-backdrop"><div className="confirm-modal"><h2>Delete Class</h2><p>Are you sure you want to delete this class?</p><div className="modal-actions"><button className="edit-btn" onClick={() => setDeleteId("")}>Cancel</button><button className="delete-btn" onClick={deleteClass}>Delete</button></div></div></div>}
    </div>
  );
}

export default ClassManagement;
