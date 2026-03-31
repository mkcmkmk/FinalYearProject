import { useMemo, useState } from "react";
import "./StudentDashboard.css";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { COURSE_CATALOG } from "../data/courseCatalog";
import StudentAIChat from "./StudentAIChat";

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#111111"/>
          <stop offset="100%" stop-color="#2f2f2f"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="600" fill="url(#bg)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="#f5f5f5" font-family="Arial, sans-serif" font-size="58" letter-spacing="6">
        HARMONIQ
      </text>
    </svg>
  `);

const INITIAL_VISIBLE_COURSES = 4;

const setFallbackImage = (event) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_IMAGE;
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAllCourses, setShowAllCourses] = useState(false);

  const visibleCourses = useMemo(
    () => (showAllCourses ? COURSE_CATALOG : COURSE_CATALOG.slice(0, INITIAL_VISIBLE_COURSES)),
    [showAllCourses]
  );

  const hasMoreCourses = COURSE_CATALOG.length > INITIAL_VISIBLE_COURSES;

  const goToPay = (plan) => {
    navigate("/pay", { state: { plan } });
  };

  const goToProfile = () => {
    navigate("/profile");
  };

  const goToChat = () => {
    navigate("/chat");
  };

  const goToCourse = (course) => {
    navigate(`/courses/${course.slug}`);
  };

  return (
    <div className="student-page">
      <header className="navbar">
        <div className="nav-left">
          <span className="menu">☰</span>
          <nav>
            <a href="#">Home</a>
            <a href="#plans">Plans</a>
            <a href="#courses">Course</a>
            <button className="nav-chat-btn" onClick={goToChat}>Chat</button>
          </nav>
        </div>

        <div className="nav-right">
          <button className="profile-btn" onClick={goToProfile} title="Profile">
            👤
          </button>
        </div>
      </header>

      <section className="hero">
        <h1>Harmoniq</h1>
        <p>
          watch, learn, create,<br />
          enjoy and inspire
        </p>

        {user && <p className="welcome-user">Welcome, {user.name}</p>}

        <div className="hero-actions">
          <button className="hero-chat-btn" onClick={goToChat}>Open Group Chat</button>
        </div>
      </section>

      <section className="plans-section" id="plans">
        <h2>Subscription Plans</h2>

        <div className="plans">
          <div className="plan-card">
            <h3>Monthly</h3>
            <p className="price">Rs 2500 / month</p>
            <ul>
              <li>2 classes in a week</li>
              <li>Any instrument</li>
              <li>Live sessions</li>
            </ul>
            <button
              onClick={() =>
                goToPay({ name: "Monthly", price: "Rs 2500", duration: "Monthly" })
              }
            >
              Pay
            </button>
          </div>

          <div className="plan-card popular">
            <h3>Quarterly</h3>
            <p className="price">Rs 4000 / quarterly</p>
            <ul>
              <li>Includes all monthly features</li>
              <li>Extra benefits for quarterly members</li>
              <li>Live sessions</li>
            </ul>
            <button
              onClick={() =>
                goToPay({
                  name: "Quarterly",
                  price: "Rs 4000",
                  duration: "Quarterly",
                })
              }
            >
              Pay
            </button>
          </div>

          <div className="plan-card">
            <h3>Yearly</h3>
            <p className="price">Rs 10000 / yearly</p>
            <ul>
              <li>Includes all previous features</li>
              <li>Beginner to advanced</li>
              <li>Recording feature</li>
            </ul>
            <button
              onClick={() =>
                goToPay({ name: "Yearly", price: "Rs 10000", duration: "Yearly" })
              }
            >
              Pay
            </button>
          </div>
        </div>
      </section>

      <section className="classes-section" id="courses">
        <div className="classes-section-head">
          <div>
            <h2>Instrument Classes</h2>
            <p>Explore featured courses first, then expand to see more instruments.</p>
          </div>
          {hasMoreCourses ? (
            <button
              className="courses-toggle-btn"
              onClick={() => setShowAllCourses((prev) => !prev)}
              type="button"
            >
              {showAllCourses ? "Show less instruments" : "See more instruments"}
            </button>
          ) : null}
        </div>

        <div className="instrument-grid">
          {visibleCourses.map((course) => (
            <div
              className="instrument-tile"
              key={course.slug}
              onClick={() => goToCourse(course)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  goToCourse(course);
                }
              }}
            >
              <div className="tile-top">
                <h3>{course.instrument}</h3>
                <p>{course.shortDescription}</p>
              </div>
              <img
                className="tile-img"
                src={course.image}
                alt={course.instrument}
                loading="lazy"
                onError={setFallbackImage}
              />
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Harmoniq</h3>
            <p>
              watch, learn, create,<br />
              enjoy and inspire
            </p>
          </div>

          <div className="footer-links">
            <div>
              <h4>Platform</h4>
              <a href="#plans">Plans</a>
              <a href="#courses">Courses</a>
              <button className="footer-chat-btn" onClick={goToChat}>Chat</button>
            </div>

            <div>
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Contact</a>
              <a href="#">Careers</a>
            </div>

            <div>
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} Harmoniq. All rights reserved.
        </div>
      </footer>

      <StudentAIChat user={user} />
    </div>
  );
};

export default StudentDashboard;
