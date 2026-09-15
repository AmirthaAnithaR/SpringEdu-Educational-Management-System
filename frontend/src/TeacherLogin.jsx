import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherLogin.css";

function TeacherLogin({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("teacher@school.com");
  const [password, setPassword] = useState("teacher123");

  const handleLogin = (e) => {
    e.preventDefault();

    // Dummy login
    if (email === "teacher@school.com" && password === "teacher123") {
      alert("Login Successful");
      if (onLogin) {
        onLogin("teacher");
      }
      navigate("/teacher-dashboard", { replace: true });
    } else {
      alert("Invalid Email or Password");
    }
  };

  return (
    <div className="teacher-login-container">
      <form className="teacher-login-form" onSubmit={handleLogin}>
        <h2>Teacher Login</h2>

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default TeacherLogin;