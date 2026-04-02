import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "./AppTopNav.css";

const navConfig = {
  dashboard: {
    label: "Dashboard",
    getPath: (role) => (role === "teacher" ? "/teacher-dashboard" : "/student-dashboard"),
  },
  chat: {
    label: "Chat",
    getPath: () => "/chat",
  },
  pay: {
    label: "Payment",
    getPath: () => "/pay",
  },
  profile: {
    label: "Profile",
    getPath: (role) => (role === "teacher" ? "/teacher-profile" : "/profile"),
  },
};

const AppTopNav = ({ items = ["dashboard", "chat", "profile"] }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || "student";
  const resolvedItems = items
    .map((key) => {
      const config = navConfig[key];
      if (!config) return null;
      return {
        key,
        label: config.label,
        path: config.getPath(role),
      };
    })
    .filter(Boolean);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const dashboardPath = navConfig.dashboard.getPath(role);

  return (
    <nav className="app-top-nav" aria-label="Main navigation">
      <button type="button" className="app-top-nav__brand" onClick={() => navigate(dashboardPath)}>
        <span className="app-top-nav__mark">H</span>
        <span>
          <strong>Harmoniq</strong>
          <small>{role === "teacher" ? "Teacher Space" : "Student Space"}</small>
        </span>
      </button>

      <div className="app-top-nav__links">
        {resolvedItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "app-top-nav__link active" : "app-top-nav__link"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <button type="button" className="app-top-nav__logout" onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
};

export default AppTopNav;
