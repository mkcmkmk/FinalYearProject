import { useState } from "react";
import "./Login.css";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/login",
        { email, password }
      );

      console.log("Login successful:", response.data);
      localStorage.setItem("token", response.data.token);

    } catch (error) {
      console.error(
        "Login failed:",
        error.response?.data?.message || error.message
      );
    }

    setClicked(true);
    setTimeout(() => setClicked(false), 120);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        {/* Header */}
        <h1 className="app-name">Harmoniq</h1>
        <p className="tagline">learn teach master and inspire</p>

        {/* Tabs */}
        <div className="tabs">
          <button
            type="button"
            className={`tab ${activeTab === "login" ? "active" : ""}`}
            onClick={() => setActiveTab("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`tab ${activeTab === "signup" ? "active" : ""}`}
            onClick={() => setActiveTab("signup")}
          >
            Sign Up
          </button>
        </div>

        {/* Form Fields */}
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field password-field">
          <label>Password</label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            className="show-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`login-btn ${clicked ? "clicked" : ""}`}
        >
          Sign In
        </button>
      </form>
    </div>
  );
};

export default Login;
