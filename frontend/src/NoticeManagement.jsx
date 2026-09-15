import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const emptyForm = {
  title: "", description: "", category: "General", audience: "All", priority: "Medium",
  publishDate: "", expiryDate: "", attachmentUrl: "", status: "Draft", createdByName: "Admin",
};

function NoticeManagement() {
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");
  const pageSize = 5;

  const fetchNotices = async () => {
    const response = await axios.get("/api/notices");
    setNotices(response.data.notices || []);
  };

  useEffect(() => { fetchNotices(); }, []);

  const saveNotice = async (status) => {
    try {
      const payload = { ...form, status };
      if (editingId) await axios.put(`/api/notices/${editingId}`, payload);
      else await axios.post("/api/notices", payload);
      setToast(status === "Published" ? "Notice published successfully" : "Notice saved as draft");
      setForm(emptyForm);
      setEditingId("");
      fetchNotices();
    } catch (error) {
      setToast(error.response?.data?.message || "Failed to save notice");
    }
  };

  const deleteNotice = async (id) => {
    if (!window.confirm("Delete this notice?")) return;
    await axios.delete(`/api/notices/${id}`);
    setToast("Notice deleted successfully");
    fetchNotices();
  };

  const toggleNotice = async (notice) => {
    const nextStatus = notice.status === "Published" ? "Unpublished" : "Published";
    await axios.put(`/api/notices/${notice._id}`, { ...notice, status: nextStatus });
    setToast(nextStatus === "Published" ? "Notice published successfully" : "Notice unpublished successfully");
    fetchNotices();
  };

  const filtered = notices.filter((notice) => {
    const matchesSearch = [notice.title, notice.category, notice.audience, notice.createdByName].join(" ").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !filter || notice.status === filter || notice.category === filter || notice.audience === filter;
    return matchesSearch && matchesFilter;
  });
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);

  return (
    <div className="student-container">
      {toast && <div className="toast-message">{toast}</div>}
      <div className="student-header">
        <h1>Notice Board</h1>
        <div className="filters"><input className="search" placeholder="Search notices..." value={search} onChange={(e) => setSearch(e.target.value)} /><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">All Filters</option>{["General","Exam","Holiday","Meeting","Emergency","All","Students","Teachers","Parents","Classes","Published","Draft","Unpublished"].map((item) => <option key={item}>{item}</option>)}</select></div>
      </div>
      <form className="inline-form" onSubmit={(e) => e.preventDefault()}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{["General","Exam","Holiday","Meeting","Emergency"].map((item) => <option key={item}>{item}</option>)}</select>
        <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>{["All","Students","Teachers","Parents","Classes"].map((item) => <option key={item}>{item}</option>)}</select>
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{["Low","Medium","High"].map((item) => <option key={item}>{item}</option>)}</select>
        <input type="date" value={form.publishDate?.slice(0, 10)} onChange={(e) => setForm({ ...form, publishDate: e.target.value })} />
        <input type="date" value={form.expiryDate?.slice(0, 10)} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
        <input placeholder="Attachment URL (PDF/Image)" value={form.attachmentUrl} onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })} />
        <button className="add-btn" type="button" onClick={() => saveNotice("Published")}>Publish</button>
        <button className="edit-btn" type="button" onClick={() => saveNotice("Draft")}>Save Draft</button>
        <button className="delete-btn" type="button" onClick={() => { setForm(emptyForm); setEditingId(""); }}>Cancel</button>
      </form>
      <div className="table-container">
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Category</th><th>Target Audience</th><th>Created By</th><th>Created Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{paged.map((notice) => <tr key={notice._id}><td>{notice.title}</td><td>{notice.category}</td><td>{notice.audience}</td><td>{notice.createdByName || notice.publishedBy?.name || "Admin"}</td><td>{notice.createdAt?.slice(0, 10)}</td><td>{notice.status}</td><td><button className="edit-btn" onClick={() => alert(notice.description)}>View</button><button className="edit-btn" onClick={() => { setEditingId(notice._id); setForm({ ...emptyForm, ...notice, publishDate: notice.publishDate?.slice(0, 10), expiryDate: notice.expiryDate?.slice(0, 10) }); }}>Edit</button><button className="edit-btn" onClick={() => toggleNotice(notice)}>{notice.status === "Published" ? "Unpublish" : "Publish"}</button><button className="delete-btn" onClick={() => deleteNotice(notice._id)}>Delete</button></td></tr>)}</tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state"><div className="empty-icon">📌</div><h2>No notices found</h2><p>Create a notice for students, teachers, parents, or everyone.</p></div>}
        <div className="pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button><span>Page {page}</span><button disabled={page * pageSize >= filtered.length} onClick={() => setPage(page + 1)}>Next</button></div>
      </div>
    </div>
  );
}

export default NoticeManagement;
