import { useNavigate } from "react-router-dom";
import logo from "./assets/logo.jpg";

function Navbar({ onLogout }) {
  const navigate = useNavigate();
  function handleLogout() {
    if (onLogout) onLogout();
    navigate('/', { replace: true });
  }
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <img src={logo} alt="Logo" className="nav-logo" />
          <h1 className="navbar-title">SpringEdu</h1>
        </div>
        <div className="navbar-right-actions">
          <button className="delete-btn logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
export default Navbar;