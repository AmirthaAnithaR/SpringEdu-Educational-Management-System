import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./TeacherDashboard.css";

const emptyForm = {
  title: "",
  category: "General",
  audience: "Teachers",
  class: "",
  description: "",
  priority: "Medium",
  publishDate: "",
  expiryDate: "",
  attachment: "",
};

const categories = ["General", "Exam", "Holiday", "Meeting", "Emergency"];
const priorities = ["High", "Medium", "Low"];
const audiences = ["All", "Teachers", "Classes"];
const pageSize = 10;

function TeacherNotices() {
  const [notices, setNotices] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");

  const user = getStoredUser();
  const canCreateNotice = user?.role === "teacher";

  const filteredNotices = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return notices
      .filter((notice) => {
        const matchesSearch = !searchText || [notice.title, notice.description, notice.category, notice.createdByName, notice.createdBy?.name].join(" ").toLowerCase().includes(searchText);
        const matchesCategory = !categoryFilter || notice.category === categoryFilter;
        const matchesPriority = !priorityFilter || notice.priority === priorityFilter;
        return matchesSearch && matchesCategory && matchesPriority;
      })
      .sort((a, b) => {
        const first = new Date(a.publishDate || a.createdAt || 0).getTime();
        const second = new Date(b.publishDate || b.createdAt || 0).getTime();
        return sortOrder === "newest" ? second - first : first - second;
      });
  }, [notices, search, categoryFilter, priorityFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / pageSize));
  const pagedNotices = filteredNotices.slice((page - 1) * pageSize, page * pageSize);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`/api/notices?userId=${user?._id || user?.id || ""}&role=${user?.role || ""}`);
      setNotices(response.data.notices || []);
    } catch (err) {
      console.error("Error loading teacher notices:", err);
      setError(err.response?.data?.message || "Unable to load notices right now.");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    if (!user?._id && !user?.id) return;
    try {
      const response = await axios.get(`/api/classes/teacher/${user._id || user.id}`);
      setClasses(response.data.classes || []);
    } catch (err) {
      console.error("Error loading notice classes:", err);
      setClasses([]);
    }
  };

  useEffect(() => {
    fetchNotices();
    fetchClasses();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, priorityFilter, sortOrder]);

  const openNotice = async (noticeId) => {
    try {
      setDetailLoading(true);
      const response = await axios.get(`/api/notices/${noticeId}`);
      setSelectedNotice(response.data.notice);
    } catch (err) {
      console.error("Error loading notice details:", err);
      setMessage(err.response?.data?.message || "Unable to load notice details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Title is required.";
    if (!form.description.trim()) return "Description is required.";
    if (form.publishDate && form.expiryDate && new Date(form.publishDate) > new Date(form.expiryDate)) {
      return "Publish Date cannot be after Expiry Date.";
    }
    return "";
  };

  const saveNotice = async (status) => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      setMessage("");
      await axios.post("/api/notices", {
        ...form,
        class: form.audience === "Classes" ? form.class || null : null,
        status,
        createdBy: user?._id || user?.id,
      });
      setMessage(status === "Published" ? "Notice published successfully." : "Notice saved as draft.");
      setForm(emptyForm);
      setShowCreate(false);
      fetchNotices();
    } catch (err) {
      console.error("Error saving teacher notice:", err);
      setFormError(err.response?.data?.message || "Unable to save notice right now.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="teacher-dashboard-page">
      <style>{noticeStyles}</style>
      <div className="teacher-dashboard-header">
        <h1>Notices</h1>
      </div>

      <div className="teacher-notice-toolbar">
        <input placeholder="Search Notice" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Category Filter</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">Priority Filter</option>
          {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        {canCreateNotice && <button type="button" onClick={() => setShowCreate(true)}>+ Create Notice</button>}
      </div>

      {message && <div className="teacher-notice-message">{message}</div>}

      {showCreate && (
        <CreateNoticeForm
          form={form}
          setForm={setForm}
          classes={classes}
          formError={formError}
          saving={saving}
          publish={() => saveNotice("Published")}
          draft={() => saveNotice("Draft")}
          close={() => {
            setShowCreate(false);
            setForm(emptyForm);
            setFormError("");
          }}
        />
      )}

      {loading && <SkeletonCards />}
      {!loading && error && <StateCard title="Unable to Load Notices" message={error} action={fetchNotices} />}
      {!loading && !error && filteredNotices.length === 0 && <StateCard icon="📢" title="No Notices Available" message="There are no notices to display." />}
      {!loading && !error && filteredNotices.length > 0 && (
        <>
          <div className="teacher-notice-grid">
            {pagedNotices.map((notice) => (
              <article key={notice._id} className="teacher-notice-card">
                <div className="teacher-notice-card-head">
                  <h2>📢 {notice.title}</h2>
                  <span className={`notice-priority notice-priority-${notice.priority?.toLowerCase()}`}>{notice.priority || "Medium"}</span>
                </div>
                <div className="teacher-notice-meta">
                  <span>{notice.category || "General"}</span>
                  <span>{formatDate(notice.publishDate || notice.createdAt)}</span>
                </div>
                <p>{shortText(notice.description)}</p>
                <div className="teacher-notice-footer">
                  <span>Created By: {notice.createdBy?.name || notice.createdByName || notice.publishedBy?.name || "Admin"}</span>
                  <button type="button" onClick={() => openNotice(notice._id)}>View</button>
                </div>
              </article>
            ))}
          </div>
          {filteredNotices.length > pageSize && (
            <div className="teacher-notice-pagination">
              <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {detailLoading && <div className="teacher-notice-modal-backdrop"><div className="teacher-notice-modal"><p>Loading notice...</p></div></div>}
      {selectedNotice && <NoticeModal notice={selectedNotice} close={() => setSelectedNotice(null)} />}
    </div>
  );
}

function getStoredUser() {
  const userVal = localStorage.getItem("user");
  return userVal ? JSON.parse(userVal) : null;
}

function CreateNoticeForm({ form, setForm, classes, formError, saving, publish, draft, close }) {
  return (
    <div className="teacher-notice-form">
      <div className="teacher-notice-form-grid">
        <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Audience<select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value, class: "" })}>{audiences.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Class<select value={form.class} disabled={form.audience !== "Classes"} onChange={(e) => setForm({ ...form, class: e.target.value })}><option value="">Class (optional)</option>{classes.map((cls) => <option key={cls._id} value={cls._id}>{cls.className} - {cls.section}</option>)}</select></label>
        <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Publish Date<input type="date" value={form.publishDate} onChange={(e) => setForm({ ...form, publishDate: e.target.value })} /></label>
        <label>Expiry Date<input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></label>
        <label>Attachment Upload<input type="file" onChange={(e) => setForm({ ...form, attachment: e.target.files?.[0]?.name || "" })} /></label>
      </div>
      {form.attachment && <p className="teacher-notice-file">Attachment: {form.attachment}</p>}
      {formError && <p className="teacher-notice-error">{formError}</p>}
      <div className="teacher-notice-form-actions">
        <button type="button" className="teacher-notice-secondary" onClick={close}>Cancel</button>
        <button type="button" className="teacher-notice-secondary" disabled={saving} onClick={draft}>Save as Draft</button>
        <button type="button" disabled={saving} onClick={publish}>{saving ? "Publishing..." : "Publish"}</button>
      </div>
    </div>
  );
}

function NoticeModal({ notice, close }) {
  const attachment = notice.attachment || notice.attachmentUrl;
  const className = notice.class ? `${notice.class.className || ""} ${notice.class.section || ""}`.trim() : "";

  return (
    <div className="teacher-notice-modal-backdrop" onClick={close}>
      <div className="teacher-notice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="teacher-notice-modal-head">
          <h2>{notice.title}</h2>
          <button type="button" onClick={close}>x</button>
        </div>
        <p className="teacher-notice-modal-desc">{notice.description}</p>
        <div className="teacher-notice-detail-grid">
          <Detail label="Category" value={notice.category} />
          <Detail label="Audience" value={notice.audience} />
          {className && <Detail label="Class" value={className} />}
          <Detail label="Created By" value={notice.createdBy?.name || notice.createdByName || notice.publishedBy?.name || "Admin"} />
          <Detail label="Publish Date" value={formatDate(notice.publishDate)} />
          <Detail label="Expiry Date" value={formatDate(notice.expiryDate)} />
        </div>
        {attachment && (
          <a className="teacher-notice-download" href={attachment.startsWith("http") ? attachment : "#"} target="_blank" rel="noreferrer">
            Attachment Download
          </a>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return <div className="teacher-notice-detail"><strong>{label}</strong><span>{value || "N/A"}</span></div>;
}

function SkeletonCards() {
  return <div className="teacher-notice-grid">{Array.from({ length: 6 }, (_, index) => <div key={index} className="teacher-notice-card teacher-notice-skeleton"><span /><span /><span /><span /></div>)}</div>;
}

function StateCard({ icon, title, message, action }) {
  return <div className="teacher-classes-state teacher-classes-empty"><div className="empty-illustration">{icon || "!"}</div><h2>{title}</h2><p>{message}</p>{action && <button type="button" onClick={action}>Retry</button>}</div>;
}

function formatDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function shortText(text) {
  if (!text) return "";
  return text.length > 130 ? `${text.slice(0, 130)}...` : text;
}

const noticeStyles = `
.teacher-notice-toolbar { display: grid; grid-template-columns: 1.4fr repeat(3, minmax(140px, 0.8fr)) auto; gap: 12px; margin-bottom: 20px; }
.teacher-notice-toolbar input, .teacher-notice-toolbar select, .teacher-notice-form input, .teacher-notice-form select, .teacher-notice-form textarea { min-height: 40px; padding: 9px 11px; border: 1px solid #c8c4ef; border-radius: 6px; background: #ffffff; color: #20223a; font-weight: 700; outline: none; box-sizing: border-box; }
.teacher-notice-toolbar input:focus, .teacher-notice-toolbar select:focus, .teacher-notice-form input:focus, .teacher-notice-form select:focus, .teacher-notice-form textarea:focus { border-color: #5149bd; box-shadow: 0 0 0 2px rgba(81, 73, 189, 0.12); }
.teacher-notice-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }
.teacher-notice-card { display: flex; flex-direction: column; min-height: 210px; padding: 20px; background: #ffffff; border: 1px solid #dddafa; border-left: 5px solid #5149bd; border-radius: 8px; box-shadow: 0 12px 28px rgba(81, 73, 189, 0.12); }
.teacher-notice-card-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.teacher-notice-card h2 { margin: 0; color: #17133f; font-size: 20px; line-height: 1.25; }
.notice-priority { flex: 0 0 auto; padding: 5px 10px; border-radius: 999px; font-size: 12px; font-weight: 900; background: #f0efff; color: #5149bd; }
.notice-priority-high { background: #fff0f3; color: #c0183d; }
.notice-priority-low { background: #eaf8ef; color: #16733a; }
.teacher-notice-meta { display: flex; flex-wrap: wrap; gap: 10px; margin: 14px 0; color: #5149bd; font-size: 13px; font-weight: 800; }
.teacher-notice-card p { flex: 1; margin: 0 0 16px; color: #4c4f68; line-height: 1.55; }
.teacher-notice-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: #5c5f78; font-size: 13px; font-weight: 700; }
.teacher-notice-message { margin-bottom: 16px; padding: 12px 14px; border: 1px solid #cdebd6; border-radius: 8px; background: #f0fbf4; color: #177a3b; font-weight: 800; }
.teacher-notice-form { margin-bottom: 22px; padding: 18px; background: #ffffff; border: 1px solid #dddafa; border-radius: 8px; box-shadow: 0 12px 28px rgba(81, 73, 189, 0.12); }
.teacher-notice-form-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.teacher-notice-form label { display: grid; gap: 7px; color: #5149bd; font-size: 13px; font-weight: 800; }
.teacher-notice-form textarea { min-height: 96px; resize: vertical; }
.teacher-notice-form label:nth-child(5) { grid-column: span 2; }
.teacher-notice-form-actions, .teacher-notice-pagination { display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
.teacher-notice-secondary { background: #ffffff !important; color: #5149bd !important; border: 1px solid #c8c4ef !important; }
.teacher-notice-error { margin: 12px 0 0; color: #c0183d; font-weight: 800; }
.teacher-notice-file { margin: 12px 0 0; color: #5c5f78; font-weight: 700; }
.teacher-main-content button:disabled { opacity: 0.62; cursor: not-allowed; }
.teacher-notice-pagination { padding: 18px; color: #20223a; font-weight: 800; }
.teacher-notice-modal-backdrop { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 20px; background: rgba(23, 19, 63, 0.54); }
.teacher-notice-modal { width: min(760px, 100%); max-height: calc(100vh - 40px); overflow-y: auto; padding: 24px; background: #ffffff; border-radius: 8px; box-shadow: 0 24px 70px rgba(23, 19, 63, 0.32); }
.teacher-notice-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding-bottom: 14px; margin-bottom: 16px; border-bottom: 1px solid #e7e5fb; }
.teacher-notice-modal-head h2 { margin: 0; color: #17133f; font-size: 26px; }
.teacher-notice-modal-head button { width: 36px; min-height: 36px; padding: 0; border-radius: 50%; background: #f0efff; color: #5149bd; }
.teacher-notice-modal-desc { margin: 0 0 18px; color: #20223a; line-height: 1.65; }
.teacher-notice-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.teacher-notice-detail { padding: 13px; border: 1px solid #eeeef8; border-radius: 8px; background: #fbfbff; }
.teacher-notice-detail strong { display: block; margin-bottom: 5px; color: #5149bd; font-size: 13px; }
.teacher-notice-detail span { color: #20223a; font-weight: 800; }
.teacher-notice-download { display: inline-flex; margin-top: 18px; min-height: 36px; align-items: center; padding: 8px 16px; border-radius: 6px; background: #5149bd; color: #ffffff; font-weight: 800; text-decoration: none; }
.teacher-notice-skeleton span { display: block; height: 16px; margin-bottom: 15px; border-radius: 6px; background: #e8e7f5; }
.teacher-notice-skeleton span:first-child { width: 70%; height: 24px; }
.teacher-notice-skeleton span:nth-child(3) { width: 95%; }
.teacher-notice-skeleton span:nth-child(4) { width: 45%; margin-top: auto; }
@media (max-width: 1100px) { .teacher-notice-toolbar { grid-template-columns: repeat(2, minmax(0, 1fr)); } .teacher-notice-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) { .teacher-notice-toolbar, .teacher-notice-form-grid, .teacher-notice-detail-grid { grid-template-columns: 1fr; } .teacher-notice-form label:nth-child(5) { grid-column: span 1; } .teacher-notice-footer { align-items: stretch; flex-direction: column; } }
`;

export default TeacherNotices;
