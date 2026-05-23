import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "./StudentTopNav.css";

const StudentTopNav = ({ active = "home" }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goHome = () => navigate("/student-dashboard");
  const goPlans = () => navigate("/student-dashboard#plans");
  const goCourses = () => navigate("/student-dashboard#courses");
  const goSchedule = () => navigate("/schedule");
  const goChat = () => navigate("/chat");
  const goProfile = () => navigate(user?.role === "teacher" ? "/teacher-profile" : "/profile");

  const linkClass = (key) =>
    active === key ? "student-nav-link active" : "student-nav-link";

  const chatClass =
    active === "chat" ? "student-nav-chat-btn active" : "student-nav-chat-btn";

  return (
    <header className="student-top-nav">
      <div className="student-top-nav__left">
        <span className="student-top-nav__menu">☰</span>
        <nav className="student-top-nav__links" aria-label="Student navigation">
          <button type="button" className={linkClass("home")} onClick={goHome}>
            Home
          </button>
          <button type="button" className={linkClass("plans")} onClick={goPlans}>
            Plans
          </button>
          <button type="button" className={linkClass("courses")} onClick={goCourses}>
            Course
          </button>
          <button type="button" className={linkClass("schedule")} onClick={goSchedule}>
            Schedule
          </button>
          <button type="button" className={chatClass} onClick={goChat}>
            Chat
          </button>
        </nav>
      </div>

      <div className="student-top-nav__right">
        <button className="student-top-nav__profile" onClick={goProfile} title="Profile" type="button">
          👤
        </button>
      </div>
    </header>
  );
};

export default StudentTopNav;
