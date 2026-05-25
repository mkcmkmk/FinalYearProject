import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";

const dashboardForRole = (role) => {
  if (role === "admin") return "/admin-dashboard";
  if (role === "teacher") return "/teacher-dashboard";
  return "/student-dashboard";
};

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to={dashboardForRole(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
