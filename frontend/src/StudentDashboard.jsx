import { Outlet } from "react-router-dom";
import "./StudentDashboard.css";
import StudentNavbar from "./StudentNavbar";
import StudentSidebar from "./StudentSidebar";
function StudentDashboard() {
  return (
    <>
      <StudentNavbar />
      <div className="student-dashboard-container">
        <StudentSidebar />
        <main className="student-main-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
export default StudentDashboard;
