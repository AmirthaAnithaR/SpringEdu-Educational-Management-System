import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const emptyForm = { subjectCode: "", subjectName: "", department: "", assignedTeacher: "", credits: 0, description: "", status: "active" };

function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");
  const pageSize = 5;

  const fetchSubjects = async () => {
    const response = await axios.get("/api/subjects");
    setSubjects(response.data.subjects || []);
  };

  useEffect(() => { fetchSubjects(); }, []);

  const saveSubject = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await axios.put(`/api/subjects/${editingId}`, form);
      else await axios.post("/api/subjects", form);
      setToast(editingId ? "Subject updated successfully" : "Subject added successfully");
      setForm(emptyForm);
      setEditingId("");
      fetchSubjects();
    } catch (error) {
      setToast(error.response?.data?.message || "Failed to save subject");
    }
  };

  const deleteSubject = async (id) => {
    if (!window.confirm("Delete this subject?")) return;
    await axios.delete(`/api/subjects/${id}`);
    setToast("Subject deleted successfully");
    fetchSubjects();
  };

  const filtered = subjects.filter((s) => [s.subjectCode, s.subjectName, s.department, s.assignedTeacher].join(" ").toLowerCase().includes(search.toLowerCase()));
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);

  return (
    <div className="student-container subject-container">
      {toast && <div className="toast-message">{toast}</div>}
      <div className="student-header"><h1>Subject Management</h1><input className="search" placeholder="Search subject..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <form className="inline-form" onSubmit={saveSubject}>
        {["subjectCode", "subjectName", "department", "assignedTeacher", "credits", "description"].map((field) => (
          <input key={field} type={field === "credits" ? "number" : "text"} placeholder={field.replace(/([A-Z])/g, " $1")} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required={["subjectCode", "subjectName"].includes(field)} />
        ))}
        <button className="add-btn" type="submit">{editingId ? "Update Subject" : "Add Subject"}</button>
      </form>
      <div className="table-container">
        <table className="admin-table">
          <thead><tr><th>Subject Code</th><th>Subject Name</th><th>Department</th><th>Teacher</th><th>Credits</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{paged.map((s) => <tr key={s._id}><td>{s.subjectCode}</td><td>{s.subjectName}</td><td>{s.department}</td><td>{s.assignedTeacher || s.teacher?.fullName || "N/A"}</td><td>{s.credits}</td><td>{s.status}</td><td><button className="edit-btn" onClick={() => alert(s.description || "No description")}>View</button><button className="edit-btn" onClick={() => { setEditingId(s._id); setForm({ ...emptyForm, ...s }); }}>Edit</button><button className="delete-btn" onClick={() => deleteSubject(s._id)}>Delete</button></td></tr>)}</tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state"><div className="empty-icon">📚</div><h2>No subjects found</h2><p>Add subjects and assign teachers.</p></div>}
        <div className="pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button><span>Page {page}</span><button disabled={page * pageSize >= filtered.length} onClick={() => setPage(page + 1)}>Next</button></div>
      </div>
    </div>
  );
}

export default SubjectManagement;
