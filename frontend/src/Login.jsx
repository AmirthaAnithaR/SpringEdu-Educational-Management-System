import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "./assets/logo.jpg";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleSelection, setRoleSelection] = useState("admin");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "/api/auth/login",
        {
          email,
          password,
        }
      );

      console.log("Login Success:", response.data);

      // Save JWT token
      localStorage.setItem("token", response.data.token);

      // Save logged-in user
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      // Get role from backend
      const role = response.data.user.role;

      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (role === "teacher") {
        navigate("/teacher-dashboard", { replace: true });
      } else if (role === "student") {
        navigate("/student-dashboard", { replace: true });
      } else {
        alert("Invalid role");
      }
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Login Failed"
      );
    }
  };

  return (
    <div className={`login-page login-page-${roleSelection}`}>
      <form
        className={`login-page-box login-page-box-${roleSelection}`}
        onSubmit={handleSubmit}
      >
        <img
          src={logo}
          alt="Logo"
          className="login-page-logo"
        />

        <h2>SpringEdu</h2>
        <h3 className="login-subtitle">Spring Public School</h3>
        <p className="login-description">Educational Management Portal</p>

        <select
          className="form-select"
          value={roleSelection}
          onChange={(e) => setRoleSelection(e.target.value)}
        >
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;