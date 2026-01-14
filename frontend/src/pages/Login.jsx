import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import { useAuth } from "../context/authContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await axios.post(
        "http://localhost:3000/api/auth/login",
        { email, password }
      );

      if (res.data.success) {
        login(res.data.user);
        localStorage.setItem("token", res.data.token);

        const role = res.data.user.role;
        if (role === "admin") navigate("/admin-dashboard");
        else if (role === "teacher") navigate("/teacher-dashboard");
        else navigate("/student-dashboard");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Server error");
    }
  };

  return (
    <div className="auth-page">
      {/* Top Welcome */}
      <div className="welcome">
        <h1>Welcome</h1>
        <p>Sign in to continue to your dashboard</p>
      </div>

      {/* Card */}
      <div className="auth-card">
        <h2>Get Started</h2>
        <p className="subtitle">Choose your preferred method to continue</p>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={activeTab === "login" ? "tab active" : "tab"}
            onClick={() => setActiveTab("login")}
          >
            Login
          </button>
          <button
              type="button"
              className={activeTab === "signup" ? "tab active" : "tab"}
              onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn">
            Sign In
          </button>
        </form>
      </div>

      <p className="footer-text">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};

export default Login;
