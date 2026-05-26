import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./AdminLogin.css";
import { useAuth } from "../context/authContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const FEATURES = [
  { icon: "♪", title: "Learn any instrument", desc: "Piano, guitar, vocals, and more — all in one place" },
  { icon: "◉", title: "Expert teachers", desc: "Connect with verified instructors for your level" },
  { icon: "✓", title: "Flexible plans", desc: "Monthly, quarterly, or yearly subscriptions" },
];

let googleScriptPromise;

const loadGoogleIdentityScript = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load Google Sign-In")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Unable to load Google Sign-In"));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

const redirectToDashboard = (navigate, role) => {
  if (role === "admin") navigate("/admin-dashboard");
  else if (role === "teacher") navigate("/teacher-dashboard");
  else navigate("/student-dashboard");
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleStatus, setGoogleStatus] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const completeLogin = useCallback(
    (responseData) => {
      login(responseData.user);
      localStorage.setItem("token", responseData.token);
      redirectToDashboard(navigate, responseData.user.role);
    },
    [login, navigate]
  );

  const handleGoogleCredential = useCallback(
    async (response) => {
      const credential = response?.credential;

      if (!credential) {
        setError("Google sign-in did not return a valid credential.");
        return;
      }

      try {
        setGoogleLoading(true);
        setError(null);

        const res = await axios.post(`${API_BASE}/api/auth/google`, { credential });

        if (res.data?.success) {
          completeLogin(res.data);
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Google sign-in failed");
      } finally {
        setGoogleLoading(false);
      }
    },
    [completeLogin]
  );

  useEffect(() => {
    let cancelled = false;

    const initializeGoogle = async () => {
      if (!googleClientId) {
        setGoogleStatus("Google Sign-In is not configured yet.");
        return;
      }

      try {
        setGoogleStatus("Loading Google Sign-In...");
        await loadGoogleIdentityScript();

        if (cancelled || !googleButtonRef.current || !window.google?.accounts?.id) {
          return;
        }

        googleButtonRef.current.innerHTML = "";

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: "signin",
          ux_mode: "popup",
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: 360,
        });

        setGoogleStatus("");
      } catch (scriptError) {
        setGoogleStatus(scriptError.message || "Unable to load Google Sign-In.");
      }
    };

    initializeGoogle();

    return () => {
      cancelled = true;
    };
  }, [googleClientId, handleGoogleCredential]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.data?.success) {
        completeLogin(res.data);
      } else {
        setError(res.data?.message || "Login failed.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

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
            <h1>Your music journey starts here</h1>
            <p>
              Sign in to access lessons, schedules, payments, and your personal dashboard —
              whether you are a student or a teacher.
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
            <div className="admin-badge">Welcome back</div>
            <h2>Sign in</h2>
            <p>Use your email or continue with Google.</p>
          </div>

          <div className="auth-tabs">
            <button type="button" className="auth-tab active">
              Login
            </button>
            <button type="button" className="auth-tab" onClick={() => navigate("/signup")}>
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

          <form onSubmit={handleSubmit}>
            <div className="admin-field">
              <label htmlFor="login-email">Email address</label>
              <div className="admin-input-wrap">
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="admin-field">
              <label htmlFor="login-password">
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
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="auth-support-row">
              <button type="button" className="auth-forgot-btn" title="Forgot password is coming soon">
                Forgot password?
              </button>
            </div>

            <button type="submit" className="admin-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="admin-spinner" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="google-login-shell">
            <div ref={googleButtonRef} className="google-button-slot" />
            {googleLoading ? <p className="google-status">Signing you in with Google…</p> : null}
            {!googleLoading && googleStatus ? <p className="google-status">{googleStatus}</p> : null}
            <p className="google-note">
              New Google accounts are created as students. Existing teacher or admin emails keep their role.
            </p>
          </div>

          <div className="admin-login-footer">
            <p className="auth-link-text">
              Don&apos;t have an account?{" "}
              <button type="button" className="auth-link-btn" onClick={() => navigate("/signup")}>
                Create one
              </button>
            </p>
            <p className="auth-legal">
              By continuing, you agree to our Terms of Service and Privacy Policy.
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

export default Login;
