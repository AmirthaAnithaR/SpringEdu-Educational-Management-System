import { Routes, Route, Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import AdminDashboard from "./AdminDashboard";
import TeacherDashboard from "./TeacherDashboard";
import TeacherDashboardHome from "./TeacherDashboardHome";
import TeacherClasses from "./TeacherClasses";
import TeacherAttendance from "./TeacherAttendance";
import TeacherMarks from "./TeacherMarks";
import TeacherNotices from "./TeacherNotices";
import TeacherProfile from "./TeacherProfile";
import StudentList from "./StudentList";
import StudentDetails from "./StudentDetails";
import EditStudent from "./EditStudent";
import TeacherList from "./TeacherList";
import TeacherDetails from "./TeacherDetails";
import EditTeacher from "./EditTeacher";
import ClassManagement from "./ClassManagement";
import Login from "./Login";
import AttendanceReports from "./AttendanceReports";
import NoticeManagement from "./NoticeManagement";
import StudentDashboard from "./StudentDashboard";
import StudentDashboardHome from "./StudentDashboardHome";
import StudentProfile from "./StudentProfile";
import StudentSubjects from "./StudentSubjects";
import StudentAttendance from "./StudentAttendance";
import StudentResults from "./StudentResults";
import StudentNotices from "./StudentNotices";
import AddStudent from "./AddStudent";
import AddTeacher from "./AddTeacher";
import "./App.css";

const AdminLayout = () => (
  <>
    <AdminNavbar />
    <div className="admin-container">
      <AdminSidebar />
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  </>
);

function App() {
  return (
    <Routes>

   
      <Route path="/" element={<Login />} />

      <Route path="/admin" element={<AdminLayout />}>
       <Route index element={<AdminDashboard />} />
  <Route path="students" element={<StudentList />} />
  <Route path="students/add" element={<AddStudent />} />
  <Route path="students/:id" element={<StudentDetails />} />
  <Route path="students/:id/edit" element={<EditStudent />} />
  <Route path="teachers" element={<TeacherList />} />
  <Route path="teachers/add" element={<AddTeacher />} />
  <Route path="teachers/:id" element={<TeacherDetails />} />
  <Route path="teachers/:id/edit" element={<EditTeacher />} />
  <Route path="classes" element={<ClassManagement />} />
  <Route path="attendance-reports" element={<AttendanceReports />} />
  <Route path="notices" element={<NoticeManagement />} />
</Route>

     
      <Route path="/teacher-dashboard" element={<TeacherDashboard />}>
        <Route index element={<TeacherDashboardHome />} />
        <Route path="classes" element={<TeacherClasses />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="marks" element={<TeacherMarks />} />
        <Route path="notices" element={<TeacherNotices />} />
        <Route path="profile" element={<TeacherProfile />} />
      </Route>

      
      <Route path="/student-dashboard" element={<StudentDashboard />}>
        <Route index element={<StudentDashboardHome />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="subjects" element={<StudentSubjects />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="notices" element={<StudentNotices />} />
      </Route>

    </Routes>
  );
}

export default App;
