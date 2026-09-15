import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "/api/students";
const pageSizeOptions = [5, 10, 20, 50];

function StudentList() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(API_URL);
      setStudents(Array.isArray(response.data?.students) ? response.data.students : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, classFilter, sectionFilter, statusFilter, pageSize]);

  const filteredStudents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return students.filter((student) => {
      const searchable = [
        student.admissionNumber,
        student.rollNumber,
        student.name,
        student.user?.name,
        student.user?.email,
        student.phone,
      ].join(" ").toLowerCase();

      const matchesSearch = !search || searchable.includes(search);
      const matchesClass = !classFilter || student.className === classFilter;
      const matchesSection = !sectionFilter || student.section === sectionFilter;
      const matchesStatus = !statusFilter || (student.status || "Active") === statusFilter;

      return matchesSearch && matchesClass && matchesSection && matchesStatus;
    });
  }, [students, searchTerm, classFilter, sectionFilter, statusFilter]);

  const sortedStudents = useMemo(() => {
    const getValue = (student, key) => {
      if (key === "email") return student.user?.email || "";
      if (key === "createdAt") return student.createdAt || "";
      return student[key] || "";
    };

    return [...filteredStudents].sort((a, b) => {
      const aValue = String(getValue(a, sortConfig.key)).toLowerCase();
      const bValue = String(getValue(b, sortConfig.key)).toLowerCase();
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredStudents, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / pageSize));
  const paginatedStudents = sortedStudents.slice((page - 1) * pageSize, page * pageSize);

  const uniqueClasses = [...new Set(students.map((student) => student.className).filter(Boolean))].sort();
  const uniqueSections = [...new Set(students.map((student) => student.section).filter(Boolean))].sort();

  const requestSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const resetFilters = () => {
    setSearchTerm("");
    setClassFilter("");
    setSectionFilter("");
    setStatusFilter("");
    setSortConfig({ key: "createdAt", direction: "desc" });
    setPage(1);
  };

  const exportExcel = () => {
    const headers = ["Admission No", "Roll No", "Student Name", "Gender", "Class", "Section", "Email", "Phone", "Status"];
    const rows = sortedStudents.map((student) => [
      student.admissionNumber || "",
      student.rollNumber || "",
      student.name || student.user?.name || "",
      student.gender || "",
      student.className || "",
      student.section || "",
      student.user?.email || "",
      student.phone || "",
      student.status || "Active",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = "students.csv";
    link.click();
  };

  const exportPdf = () => {
    window.print();
  };

  const deleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      setDeleting(true);
      await axios.delete(`${API_URL}/${studentToDelete._id}`);
      setStudentToDelete(null);
      showToast("Student deleted successfully");
      await fetchStudents();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete student");
    } finally {
      setDeleting(false);
    }
  };

  const sortLabel = (key) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="student-container">
      {toast && <div className="toast-message">{toast}</div>}

      <div className="student-header">
        <h1>Student List</h1>
        <Link to="/admin/students/add" className="add-btn student-add-link">Add Student</Link>
      </div>

      <div className="student-toolbar">
        <input type="text" placeholder="Search by admission, roll, name, email, phone..." className="search student-search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {uniqueClasses.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
          <option value="">All Sections</option>
          {uniqueSections.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <button className="edit-btn" type="button" onClick={resetFilters}>Reset Filters</button>
        <button className="edit-btn" type="button" onClick={exportExcel} disabled={!sortedStudents.length}>Export Excel</button>
        <button className="edit-btn" type="button" onClick={exportPdf} disabled={!sortedStudents.length}>Export PDF</button>
      </div>

      <div className="table-container student-print-area">
        {loading && (
          <div className="student-loading">
            <span className="dashboard-spinner" />
            <p>Loading students...</p>
          </div>
        )}
        {!loading && error && <p className="error-message">{error}</p>}
        {!loading && !error && sortedStudents.length === 0 && (
          <div className="empty-state student-empty-state">
            <div className="empty-icon">🎓</div>
            <h2>No Students Found</h2>
            <p>Click Add Student to create your first student.</p>
            <Link to="/admin/students/add" className="add-btn">Add Student</Link>
          </div>
        )}
        {!loading && !error && sortedStudents.length > 0 && (
          <>
            <div className="student-table-meta">
              <span>Showing {paginatedStudents.length} of {sortedStudents.length} students</span>
              <label>
                Rows
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
            </div>
            <div className="student-table-scroll">
              <table className="admin-table student-table">
                <thead>
                  <tr>
                    <th>Profile Photo</th>
                    <th onClick={() => requestSort("admissionNumber")}>Admission No{sortLabel("admissionNumber")}</th>
                    <th onClick={() => requestSort("rollNumber")}>Roll No{sortLabel("rollNumber")}</th>
                    <th onClick={() => requestSort("name")}>Student Name{sortLabel("name")}</th>
                    <th onClick={() => requestSort("gender")}>Gender{sortLabel("gender")}</th>
                    <th onClick={() => requestSort("className")}>Class{sortLabel("className")}</th>
                    <th onClick={() => requestSort("section")}>Section{sortLabel("section")}</th>
                    <th onClick={() => requestSort("phone")}>Phone{sortLabel("phone")}</th>
                    <th onClick={() => requestSort("status")}>Status{sortLabel("status")}</th>
                    <th className="no-print">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map((student) => (
                    <tr key={student._id}>
                      <td>{student.profileImage ? <img className="student-avatar" src={student.profileImage} alt={student.name} /> : <span className="student-avatar-fallback">{(student.name || "S").charAt(0)}</span>}</td>
                      <td>{student.admissionNumber || "N/A"}</td>
                      <td>{student.rollNumber || "N/A"}</td>
                      <td>{student.name || student.user?.name || "N/A"}</td>
                      <td>{student.gender || "N/A"}</td>
                      <td>{student.className || "N/A"}</td>
                      <td>{student.section || "N/A"}</td>
                      <td>{student.phone || "N/A"}</td>
                      <td><span className={`student-status ${(student.status || "Active").toLowerCase()}`}>{student.status || "Active"}</span></td>
                      <td className="student-actions no-print">
                        <button className="edit-btn" onClick={() => navigate(`/admin/students/${student._id}`)}>View</button>
                        <button className="edit-btn" onClick={() => navigate(`/admin/students/${student._id}/edit`)}>Edit</button>
                        <button className="delete-btn" onClick={() => setStudentToDelete(student)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination student-pagination no-print">
              <button className="edit-btn" disabled={page === 1} onClick={() => setPage(1)}>First</button>
              <button className="edit-btn" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button className="edit-btn" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
              <button className="edit-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>Last</button>
            </div>
          </>
        )}
      </div>

      {studentToDelete && (
        <div className="modal-backdrop">
          <div className="confirm-modal">
            <h2>Delete Student</h2>
            <p>Are you sure you want to permanently delete <strong>{studentToDelete.name}</strong>? This will remove the linked user account too.</p>
            <div className="modal-actions">
              <button className="edit-btn" onClick={() => setStudentToDelete(null)} disabled={deleting}>Cancel</button>
              <button className="delete-btn" onClick={deleteStudent} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentList;
