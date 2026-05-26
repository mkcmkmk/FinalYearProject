import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./AdminLogin.css";
import { useAuth } from "../context/authContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const FEATURES = [
  { icon: "✓", title: "Free to register", desc: "Create your student account in minutes" },
  { icon: "♪", title: "Pick your instrument", desc: "Subscribe to the course that fits your goals" },
  { icon: "◎", title: "Track progress", desc: "Schedules, payments, and chat in one dashboard" },
];

const SignUp = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    contactNumber: "",
    profileImage: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordChecks, setPasswordChecks] = useState({
    hasUpperCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password) => {
    const checks = {
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      hasMinLength: password.length > 8,
    };
    setPasswordChecks(checks);
    return Object.values(checks).every(Boolean);
  };

  const onChange = (e) => {
    setError(null);
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      if (!value) setEmailError("");
      else if (!validateEmail(value)) setEmailError("Invalid email format");
      else setEmailError("");
    }

    if (name === "password") {
      if (value) validatePassword(value);
      else {
        setPasswordChecks({
          hasUpperCase: false,
          hasNumber: false,
          hasSpecialChar: false,
          hasMinLength: false,
        });
      }
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!validatePassword(form.password)) {
      setError("Password does not meet all requirements");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: form.name,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: "student",
        contactNumber: form.contactNumber ? Number(form.contactNumber) : null,
        profileImage: form.profileImage || "",
      };

      const res = await axios.post(`${API_BASE}/api/auth/register`, payload);

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
    } finally {
      setLoading(false);
    }
  };

  const passwordReady = Object.values(passwordChecks).every(Boolean);

  return (
    <div className="admin-login-page">
      <aside className="admin-login-brand">
        <div className="admin-brand-top">
          <div className="admin-logo-row">
            <div className="admin-logo-mark">H</div>
            <div className="admin-logo-text">
              Harmoniq
              <span>Music School</span>
            </div>
          </div>

          <div className="admin-brand-copy">
            <h1>Join Harmoniq today</h1>
            <p>
              Create your account to book lessons, manage subscriptions, and learn
              from experienced teachers on your schedule.
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
            <div className="admin-badge">New account</div>
            <h2>Sign up</h2>
            <p>Fill in your details to get started as a student.</p>
          </div>

          <div className="auth-tabs">
            <button type="button" className="auth-tab" onClick={() => navigate("/login")}>
              Login
            </button>
            <button type="button" className="auth-tab active">
              Sign Up
            </button>
          </div>

          {error && (
            <div className="admin-alert" role="alert">
              <span className="admin-alert-icon" aria-hidden="true">
                ⚠
              </span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignUp}>
            <div className="admin-field">
              <label htmlFor="signup-name">Full name</label>
              <div className="admin-input-wrap">
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={onChange}
                  required
                />
              </div>
            </div>

            <div className="admin-field">
              <label htmlFor="signup-email">Email address</label>
              <div className="admin-input-wrap">
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={onChange}
                  required
                  autoComplete="email"
                />
              </div>
              {emailError && <p className="field-hint error">{emailError}</p>}
            </div>

            <div className="admin-field">
              <label htmlFor="signup-password">
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
                  id="signup-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={onChange}
                  required
                  autoComplete="new-password"
                />
              </div>
              {form.password && (
                <div className="password-hints">
                  <div className={`password-hint ${passwordChecks.hasMinLength ? "ok" : "bad"}`}>
                    ✓ More than 8 characters ({form.password.length})
                  </div>
                  <div className={`password-hint ${passwordChecks.hasUpperCase ? "ok" : "bad"}`}>
                    ✓ At least one capital letter
                  </div>
                  <div className={`password-hint ${passwordChecks.hasNumber ? "ok" : "bad"}`}>
                    ✓ At least one number
                  </div>
                  <div className={`password-hint ${passwordChecks.hasSpecialChar ? "ok" : "bad"}`}>
                    ✓ At least one special character
                  </div>
                </div>
              )}
            </div>

            <div className="admin-field">
              <label htmlFor="signup-contact">Contact number (optional)</label>
              <div className="admin-input-wrap">
                <input
                  id="signup-contact"
                  name="contactNumber"
                  type="tel"
                  placeholder="98xxxxxxxx"
                  value={form.contactNumber}
                  onChange={onChange}
                />
              </div>
            </div>

            <div className="admin-field">
              <label htmlFor="signup-image">Profile image URL (optional)</label>
              <div className="admin-input-wrap">
                <input
                  id="signup-image"
                  name="profileImage"
                  type="url"
                  placeholder="https://..."
                  value={form.profileImage}
                  onChange={onChange}
                />
              </div>
            </div>

            <button
              type="submit"
              className="admin-submit-btn"
              disabled={loading || Boolean(emailError) || !form.email || !passwordReady}
            >
              {loading ? (
                <>
                  <span className="admin-spinner" aria-hidden="true" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <div className="admin-login-footer">
            <p className="auth-link-text">
              Already have an account?{" "}
              <button type="button" className="auth-link-btn" onClick={() => navigate("/login")}>
                Sign in
              </button>
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

export default SignUp;
