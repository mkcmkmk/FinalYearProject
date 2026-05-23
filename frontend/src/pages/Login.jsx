import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import { useAuth } from "../context/authContext";

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
  const [activeTab, setActiveTab] = useState("login");
  const [error, setError] = useState(null);
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

        const res = await axios.post("http://localhost:3000/api/auth/google", {
          credential,
        });

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

    try {
      const res = await axios.post(
        "http://localhost:3000/api/auth/login",
        { email, password }
      );

      if (res.data.success) {
        completeLogin(res.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Server error");
    }
  };

  return (
    <div className="auth-page">
      <div className="welcome">
        <h1>Welcome to Harmoniq</h1>
        <p>Sign in to continue to your dashboard</p>
      </div>

      <div className="auth-card">
        <h2>Get Started</h2>
        <p className="subtitle">Sign up to create your account</p>

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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-support-row">
            <button
              type="button"
              className="forgot-password-btn"
              title="Forgot password is coming soon"
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" className="login-btn">
            Sign In
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="google-login-shell">
          <div ref={googleButtonRef} className="google-button-slot" />
          {googleLoading ? <p className="google-status">Signing you in with Google...</p> : null}
          {!googleLoading && googleStatus ? <p className="google-status">{googleStatus}</p> : null}
          <p className="google-note">
            New Google accounts will be created as student accounts. Existing teacher or admin emails keep their current role.
          </p>
        </div>
      </div>

      <p className="footer-text">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};

export default Login;
