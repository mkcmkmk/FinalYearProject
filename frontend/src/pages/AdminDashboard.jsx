import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">Harmoniq</h2>
        <nav>
          <a className="active">Dashboard</a>
          <a>Users</a>
          <a>Teachers</a>
          <a>Classes</a>
          <a>Settings</a>
        </nav>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <span>Welcome, <strong>{user?.name}</strong></span>
          <button onClick={handleLogout}>Logout</button>
        </header>

        {/* Dashboard Content */}
        <section className="cards">
          <div className="card">
            <h3>Total Users</h3>
            <p>120</p>
          </div>

          <div className="card">
            <h3>Teachers</h3>
            <p>18</p>
          </div>

          <div className="card">
            <h3>Active Classes</h3>
            <p>32</p>
          </div>

          <div className="card">
            <h3>Reports</h3>
            <p>5</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
