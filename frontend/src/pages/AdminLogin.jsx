import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/authContext";
import "./Login.css";

const AdminLogin = () => {
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("Test@123");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", {
        email,
        password,
      });

      if (res.data.success) {
        login(res.data.user);
        localStorage.setItem("token", res.data.token);
        navigate("/admin-dashboard");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Server error. Have you run resetAdmin.js?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="welcome">
        <h1>Admin Portal</h1>
        <p>Sign in to access the control panel</p>
      </div>

      <div className="auth-card">
        <h2>Admin Login</h2>
        <p className="subtitle">Use the static admin credentials</p>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly
            />
          </div>

          <div className="field">
            <label>Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              readOnly
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Access Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
