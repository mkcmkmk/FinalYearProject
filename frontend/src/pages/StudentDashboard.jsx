import "./StudentDashboard.css";
import { useAuth } from "../context/authContext";

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="student-page">
      {/* Navbar */}
      <header className="navbar">
        <div className="nav-left">
          <span className="menu">☰</span>
          <nav>
            <a href="#">Home</a>
            <a href="#">Plans</a>
            <a href="#">Course</a>
            <a href="#">Schedule</a>
          </nav>
        </div>

        <div className="nav-right">
          <span className="profile">👤</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero">
        <h1>Harmoniq</h1>
        <p>
          watch, learn, create,<br />
          enjoy and inspire
        </p>

        {user && (
          <p className="welcome-user">
            Welcome, {user.name}
          </p>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
