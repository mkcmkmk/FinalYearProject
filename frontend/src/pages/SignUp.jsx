import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import { useAuth } from "../context/authContext";

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
  const [emailError, setEmailError] = useState("");
  const [passwordChecks, setPasswordChecks] = useState({
    hasUpperCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const checks = {
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
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
      if (!value) {
        setEmailError("");
      } else if (!validateEmail(value)) {
        setEmailError("Invalid email format");
      } else {
        setEmailError("");
      }
    }

    if (name === "password") {
      if (value) {
        validatePassword(value);
      } else {
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
        email: form.email,
        password: form.password,
        role: "student",
        contactNumber: form.contactNumber ? Number(form.contactNumber) : null,
        profileImage: form.profileImage || "",
      };

      const res = await axios.post("http://localhost:3000/api/auth/register", payload);

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

  return (
    <div className="auth-page">
      <div className="welcome">
        <h1>Create Account</h1>
        <p>Sign up to start using Harmoniq</p>
      </div>

      <div className="auth-card">
        <h2>Sign Up</h2>
        <p className="subtitle">Fill the details below</p>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSignUp}>
          <div className="field">
            <label>Full Name</label>
            <input
              name="name"
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={onChange}
              required
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={onChange}
              required
            />
            {emailError && <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{emailError}</p>}
          </div>

          <div className="field">
            <label>Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={onChange}
              required
            />
            {form.password && (
              <div style={{ marginTop: "8px", fontSize: "12px" }}>
                <div style={{ color: passwordChecks.hasMinLength ? "green" : "red" }}>
                  ✓ More than 8 characters ({form.password.length})
                </div>
                <div style={{ color: passwordChecks.hasUpperCase ? "green" : "red" }}>
                  ✓ At least one capital letter
                </div>
                <div style={{ color: passwordChecks.hasNumber ? "green" : "red" }}>
                  ✓ At least one number
                </div>
                <div style={{ color: passwordChecks.hasSpecialChar ? "green" : "red" }}>
                  ✓ At least one special character (!@#$%^&*...)
                </div>
              </div>
            )}
          </div>



          <div className="field">
            <label>Contact Number (optional)</label>
            <input
              name="contactNumber"
              type="tel"
              placeholder="98xxxxxxxx"
              value={form.contactNumber}
              onChange={onChange}
            />
          </div>

          <div className="field">
            <label>Profile Image URL (optional)</label>
            <input
              name="profileImage"
              type="text"
              placeholder="https://..."
              value={form.profileImage}
              onChange={onChange}
            />
          </div>

          <button 
            type="submit" 
            className="login-btn" 
            disabled={loading || emailError || !form.email || !form.password || !Object.values(passwordChecks).every(Boolean)}
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="footer-text" style={{ marginTop: 14 }}>
          Already have an account? <span className="auth-link" onClick={() => navigate("/login")}>Login</span>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
