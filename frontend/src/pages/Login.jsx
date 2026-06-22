import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../App.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {

  if (!email.trim() || !password.trim()) {
    alert("Email and Password cannot be empty");
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address");
    return;
  }

  try {
    const res = await API.post("/login", { email, password });

    if (res.data.success) {
      alert(res.data.message);
      localStorage.setItem("user", JSON.stringify(res.data));

      if (res.data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/trainee");
      }
    } else {
      alert(res.data.message || "Login Failed");
    }
  } catch (error) {
    alert("Login Failed");
    console.error(error);
  }
};

  const autofill = (type) => {
    if (type === "admin") {
      setEmail("admin@gmail.com");
      setPassword("admin123");
    } else {
      setEmail("ayushi@gmail.com");
      setPassword("123456");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎯</div>
        <h1>Task Allotment</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "-12px", marginBottom: "28px" }}>
          Organize, filter, and complete assignments.
        </p>

        <div className="form-group">
          <input 
            type="email" 
            placeholder="Enter Email Address" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        <div className="form-group">
          <input 
            type="password" 
            placeholder="Enter Account Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
        <button onClick={handleLogin} style={{ width: "100%", marginTop: "8px" }}>
          Sign In
        </button>

        <div style={{ marginTop: "32px", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 10px 0" }}>
            Quick Sandbox Login
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button 
              onClick={() => autofill("admin")} 
              style={{ padding: "6px 12px", fontSize: "11px", background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", color: "#a5b4fc" }}
            >
              🔑 Admin Profile
            </button>
            <button 
              onClick={() => autofill("trainee")} 
              style={{ padding: "6px 12px", fontSize: "11px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#a7f3d0" }}
            >
              👤 Trainee Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;