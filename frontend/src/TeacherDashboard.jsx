import { Outlet } from "react-router-dom";
import TeacherNavbar from "./TeacherNavbar";
import TeacherSidebar from "./TeacherSidebar";
import "./TeacherDashboard.css";

function TeacherDashboard() {
  return (
    <>
      <TeacherNavbar />
      <div className="teacher-container">
        <TeacherSidebar />
        <main className="teacher-main-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default TeacherDashboard;