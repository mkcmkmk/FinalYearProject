import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css"; // reuse same styling
import { useAuth } from "../context/authContext";

const SignUp = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    contactNumber: "",
    profileImage: "", // optional (url)
  });

  const [error, setError] = useState(null);

  const onChange = (e) => {
    setError(null);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // convert contactNumber to number if filled
      const payload = {
        ...form,
        contactNumber: form.contactNumber ? Number(form.contactNumber) : undefined,
      };

      const res = await axios.post("http://localhost:3000/api/auth/register", payload);

      if (res.data.success) {
        // optional auto-login
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
          </div>

          <div className="field">
            <label>Password</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={onChange}
              required
            />
          </div>

          <div className="field">
            <label>Role</label>
            <select
              name="role"
              value={form.role}
              onChange={onChange}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid #ddd",
                fontSize: "14px",
                background: "white",
              }}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
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

          <button type="submit" className="login-btn">
            Create Account
          </button>
        </form>

        <p className="footer-text" style={{ marginTop: 14 }}>
          Already have an account?{" "}
          <span
            style={{ color: "black", cursor: "pointer", fontWeight: 600 }}
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
