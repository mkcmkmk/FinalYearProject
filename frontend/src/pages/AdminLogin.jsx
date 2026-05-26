import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/authContext";
import "./AdminLogin.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const FEATURES = [
  { icon: "✓", title: "Teacher approvals", desc: "Review and verify instructor applications" },
  { icon: "₹", title: "Payment oversight", desc: "Monitor revenue and subscription activity" },
  { icon: "◎", title: "User management", desc: "Manage students, teachers, and notices" },
];

const AdminLogin = () => {
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("Test@123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email: email.trim().toLowerCase(),
        password,
      });

      if (!res.data?.success) {
        setError(res.data?.message || "Login failed.");
        return;
      }

      if (res.data.user?.role !== "admin") {
        setError("This account is not an admin. Use the main login page for students or teachers.");
        return;
      }

      login(res.data.user);
      localStorage.setItem("token", res.data.token);
      navigate("/admin-dashboard");
    } catch (err) {
      if (!err.response) {
        setError(
          "Cannot reach the API server. Run cd server → npm start, then npm run reset-admin."
        );
        return;
      }
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <aside className="admin-login-brand" aria-hidden="false">
        <div className="admin-brand-top">
          <div className="admin-logo-row">
            <div className="admin-logo-mark">H</div>
            <div className="admin-logo-text">
              Harmoniq
              <span>Admin Console</span>
            </div>
          </div>

          <div className="admin-brand-copy">
            <h1>Run your music school from one control panel</h1>
            <p>
              Secure access for platform administrators — subscriptions, verifications,
              and school-wide activity in one place.
            </p>
          </div>

          <div className="admin-feature-list">
            {FEATURES.map((item) => (
              <div key={item.title} className="admin-feature-item">
                <div className="admin-feature-icon">{item.icon}</div>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="admin-login-form-panel">
        <div className="admin-login-card">
          <div className="admin-login-card-header">
            <div className="admin-badge">
              <span aria-hidden="true">🛡</span> Administrator
            </div>
            <h2>Sign in</h2>
            <p>Enter your admin credentials to open the dashboard.</p>
          </div>

          {error && (
            <div className="admin-alert" role="alert">
              <span className="admin-alert-icon" aria-hidden="true">
                ⚠
              </span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="admin-field">
              <label htmlFor="admin-email">Email address</label>
              <div className="admin-input-wrap">
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="admin-field">
              <label htmlFor="admin-password">
                Password
                <button
                  type="button"
                  className="admin-label-action"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </label>
              <div className="admin-input-wrap">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="admin-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="admin-spinner" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                "Access dashboard"
              )}
            </button>
          </form>

          <div className="admin-login-footer">
            <p className="admin-hint">
              Dev default: <code>admin@gmail.com</code> / <code>Test@123</code>
              <br />
              Reset with <code>npm run reset-admin</code> in the server folder.
            </p>
            <Link to="/" className="admin-back-link">
              ← Back to Harmoniq home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
