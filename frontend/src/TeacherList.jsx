import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "/api/teachers";

function TeacherList() {
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(API_URL);
      setTeachers(response.data.teachers || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, departmentFilter, statusFilter, pageSize]);

  const departments = [...new Set(teachers.map((teacher) => teacher.department).filter(Boolean))].sort();

  const filteredTeachers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return teachers.filter((teacher) => {
      const searchable = [
        teacher.employeeId,
        teacher.fullName,
        teacher.user?.email,
        teacher.phone,
        teacher.department,
        teacher.subject,
        teacher.assignedClass,
      ].join(" ").toLowerCase();
      return (!search || searchable.includes(search)) &&
        (!departmentFilter || teacher.department === departmentFilter) &&
        (!statusFilter || (teacher.status || "active") === statusFilter);
    });
  }, [teachers, searchTerm, departmentFilter, statusFilter]);

  const sortedTeachers = useMemo(() => {
    const valueFor = (teacher, key) => (key === "email" ? teacher.user?.email : teacher[key]) || "";
    return [...filteredTeachers].sort((a, b) => {
      const aValue = String(valueFor(a, sortConfig.key)).toLowerCase();
      const bValue = String(valueFor(b, sortConfig.key)).toLowerCase();
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredTeachers, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedTeachers.length / pageSize));
  const paginatedTeachers = sortedTeachers.slice((page - 1) * pageSize, page * pageSize);

  const requestSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortLabel = (key) => sortConfig.key === key ? (sortConfig.direction === "asc" ? " ↑" : " ↓") : "";

  const resetFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("");
    setStatusFilter("");
    setSortConfig({ key: "createdAt", direction: "desc" });
  };

  const deleteTeacher = async () => {
    if (!teacherToDelete) return;
    try {
      setDeleting(true);
      await axios.delete(`${API_URL}/${teacherToDelete._id}`);
      setTeacherToDelete(null);
      showToast("Teacher deleted successfully");
      await fetchTeachers();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete teacher");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="student-container teacher-module">
      {toast && <div className="toast-message">{toast}</div>}
      <div className="student-header">
        <h1>Teacher Management</h1>
        <Link to="/admin/teachers/add" className="add-btn student-add-link">Add Teacher</Link>
      </div>

      <div className="student-toolbar teacher-toolbar">
        <input type="text" placeholder="Search by ID, name, email, phone, subject..." className="search student-search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map((department) => <option key={department} value={department}>{department}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="edit-btn" type="button" onClick={resetFilters}>Reset Filters</button>
      </div>

      <div className="table-container">
        {loading && <div className="student-loading"><span className="dashboard-spinner" /><p>Loading teachers...</p></div>}
        {!loading && error && <p className="error-message">{error}</p>}
        {!loading && !error && sortedTeachers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">👩‍🏫</div>
            <h2>No Teachers Found</h2>
            <p>Click Add Teacher to create your first teacher.</p>
            <Link to="/admin/teachers/add" className="add-btn">Add Teacher</Link>
          </div>
        )}
        {!loading && !error && sortedTeachers.length > 0 && (
          <>
            <div className="student-table-meta">
              <span>Showing {paginatedTeachers.length} of {sortedTeachers.length} teachers</span>
              <label>Rows
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  {[5, 10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
            </div>
            <div className="student-table-scroll">
              <table className="admin-table student-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th onClick={() => requestSort("employeeId")}>Teacher ID{sortLabel("employeeId")}</th>
                    <th onClick={() => requestSort("fullName")}>Teacher Name{sortLabel("fullName")}</th>
                    <th onClick={() => requestSort("email")}>Email{sortLabel("email")}</th>
                    <th onClick={() => requestSort("department")}>Department{sortLabel("department")}</th>
                    <th onClick={() => requestSort("subject")}>Subject{sortLabel("subject")}</th>
                    <th onClick={() => requestSort("assignedClass")}>Class{sortLabel("assignedClass")}</th>
                    <th onClick={() => requestSort("phone")}>Phone{sortLabel("phone")}</th>
                    <th onClick={() => requestSort("status")}>Status{sortLabel("status")}</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTeachers.map((teacher) => (
                    <tr key={teacher._id}>
                      <td>{teacher.photo ? <img className="student-avatar" src={teacher.photo} alt={teacher.fullName} /> : <span className="student-avatar-fallback">{(teacher.fullName || "T").charAt(0)}</span>}</td>
                      <td>{teacher.employeeId || "N/A"}</td>
                      <td>{teacher.fullName || "N/A"}</td>
                      <td>{teacher.user?.email || "N/A"}</td>
                      <td>{teacher.department || "N/A"}</td>
                      <td>{teacher.subject || "N/A"}</td>
                      <td>{teacher.assignedClass || "N/A"}</td>
                      <td>{teacher.phone || "N/A"}</td>
                      <td><span className={`student-status ${teacher.status === "inactive" ? "inactive" : ""}`}>{teacher.status || "active"}</span></td>
                      <td className="student-actions">
                        <button className="edit-btn" onClick={() => navigate(`/admin/teachers/${teacher._id}`)}>View</button>
                        <button className="edit-btn" onClick={() => navigate(`/admin/teachers/${teacher._id}/edit`)}>Edit</button>
                        <button className="delete-btn" onClick={() => setTeacherToDelete(teacher)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination student-pagination">
              <button className="edit-btn" disabled={page === 1} onClick={() => setPage(1)}>First</button>
              <button className="edit-btn" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button className="edit-btn" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
              <button className="edit-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>Last</button>
            </div>
          </>
        )}
      </div>

      {teacherToDelete && (
        <div className="modal-backdrop">
          <div className="confirm-modal">
            <h2>Delete Teacher</h2>
            <p>Are you sure you want to permanently delete <strong>{teacherToDelete.fullName}</strong>? This will remove the linked user account too.</p>
            <div className="modal-actions">
              <button className="edit-btn" disabled={deleting} onClick={() => setTeacherToDelete(null)}>Cancel</button>
              <button className="delete-btn" disabled={deleting} onClick={deleteTeacher}>{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherList;
