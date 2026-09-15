import { NavLink } from "react-router-dom";
function Sidebar() {
  return (
    <div className="admin-sidebar">
      <ul>
        <li><NavLink to="/admin" end>Dashboard</NavLink></li>
        <li><NavLink to="/admin/students">Students</NavLink></li>
        <li><NavLink to="/admin/teachers">Teachers</NavLink></li>
        <li><NavLink to="/admin/classes">Classes</NavLink></li>
        <li><NavLink to="/admin/attendance-reports">Attendance Reports</NavLink></li>
      </ul>
    </div>
  );
}
export default Sidebar;
