import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import StudentTopNav from "../components/StudentTopNav";
import { getCourseBySlug } from "../data/courseCatalog";
import "./CourseDetail.css";

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#111827"/>
          <stop offset="100%" stop-color="#312e81"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="600" fill="url(#bg)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="#ffffff" font-family="Arial, sans-serif" font-size="56" letter-spacing="4">
        HARMONIQ COURSE
      </text>
    </svg>
  `);

const setFallbackImage = (event) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_IMAGE;
};

const CourseDetail = () => {
  const navigate = useNavigate();
  const { instrumentId } = useParams();
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [error, setError] = useState("");

  const course = getCourseBySlug(instrumentId);

  useEffect(() => {
    const loadTeachers = async () => {
      if (!course) {
        setTeachers([]);
        setLoadingTeachers(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view available teachers.");
        setLoadingTeachers(false);
        return;
      }

      try {
        setLoadingTeachers(true);
        setError("");
        const res = await axios.get(
          `http://localhost:3000/api/users/teachers?instrument=${encodeURIComponent(course.instrument)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTeachers(res.data?.teachers || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load teachers right now.");
      } finally {
        setLoadingTeachers(false);
      }
    };

    loadTeachers();
  }, [course]);

  if (!course) {
    return (
      <div className="course-page">
        <StudentTopNav active="courses" />
        <div className="course-empty course-empty--standalone">
          <h1>Course not found</h1>
          <p>The instrument you selected is not available right now.</p>
          <button className="course-btn" onClick={() => navigate("/student-dashboard")}>
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-page">
      <StudentTopNav active="courses" />

      <div className="course-shell">
        <header className="course-topbar">
          <div>
            <p className="course-kicker">Instrument course</p>
            <h1>{course.title}</h1>
            <p className="course-subtitle">{course.description}</p>
          </div>

          <div className="course-actions">
            <button className="course-btn course-btn--ghost" onClick={() => navigate("/student-dashboard")}>
              Back
            </button>
            <button
              className="course-btn"
              onClick={() =>
                navigate("/pay", {
                  state: {
                    instrument: course.instrument,
                    courseName: course.title,
                  },
                })
              }
            >
              Subscribe now
            </button>
          </div>
        </header>

        <section className="course-hero-card">
          <div className="course-hero-copy">
            <div className="course-chip-row">
              <span>{course.instrument}</span>
              <span>{course.level}</span>
              <span>{course.duration}</span>
              <span>{course.classesPerWeek}</span>
            </div>
            <p>
              This course is designed to help students build technique, consistency, and musical confidence with structured live classes and guided weekly practice.
            </p>
          </div>

          <div className="course-hero-media">
            <img src={course.image} alt={course.instrument} onError={setFallbackImage} />
          </div>
        </section>

        <section className="course-grid">
          <article className="course-card">
            <p className="course-kicker">What you will learn</p>
            <h2>Course highlights</h2>
            <div className="course-list">
              {course.highlights.map((item) => (
                <div className="course-list-item" key={item}>{item}</div>
              ))}
            </div>
          </article>

          <article className="course-card">
            <p className="course-kicker">After the course</p>
            <h2>Expected outcomes</h2>
            <div className="course-list">
              {course.outcomes.map((item) => (
                <div className="course-list-item" key={item}>{item}</div>
              ))}
            </div>
          </article>
        </section>

        <section className="course-card">
          <div className="course-section-head">
            <div>
              <p className="course-kicker">Teachers</p>
              <h2>Available {course.instrument} teachers</h2>
            </div>
            <button
              className="course-btn course-btn--ghost"
              onClick={() =>
                navigate("/pay", {
                  state: {
                    instrument: course.instrument,
                    courseName: course.title,
                  },
                })
              }
            >
              Continue to subscription
            </button>
          </div>

          {error ? <div className="course-banner course-banner--error">{error}</div> : null}

          {loadingTeachers ? (
            <div className="course-empty">Loading available teachers...</div>
          ) : teachers.length === 0 ? (
            <div className="course-empty">No teachers are available for this instrument yet.</div>
          ) : (
            <div className="course-teacher-grid">
              {teachers.map((teacher) => (
                <div className="course-teacher-card" key={teacher.id || teacher._id}>
                  <div className="course-teacher-head">
                    <div className="course-teacher-avatar">
                      {teacher.profileImage ? (
                        <img src={teacher.profileImage} alt={teacher.name} onError={setFallbackImage} />
                      ) : (
                        <span>{teacher.name?.charAt(0)?.toUpperCase() || "T"}</span>
                      )}
                    </div>
                    <div>
                      <h3>{teacher.name}</h3>
                      <p>{teacher.instrumentExpertise || course.instrument}</p>
                    </div>
                  </div>

                  <div className="course-teacher-meta">
                    <div>
                      <span>Experience</span>
                      <strong>{teacher.yearsOfExperience ?? 0} years</strong>
                    </div>
                    <div>
                      <span>Groups</span>
                      <strong>{teacher.summary?.groups || 0}</strong>
                    </div>
                    <div>
                      <span>Weekly classes</span>
                      <strong>{teacher.summary?.weeklyClasses || 0}</strong>
                    </div>
                  </div>

                  <p className="course-teacher-bio">{teacher.teacherBio || "Teacher profile details will appear here soon."}</p>

                  <div className="course-teacher-actions">
                    <button className="course-btn course-btn--ghost" onClick={() => navigate(`/teachers/${teacher.id || teacher._id}`)}>
                      View profile
                    </button>
                    <button
                      className="course-btn"
                      onClick={() =>
                        navigate("/pay", {
                          state: {
                            instrument: course.instrument,
                            courseName: course.title,
                            teacherName: teacher.name,
                            teacherId: teacher.id || teacher._id,
                          },
                        })
                      }
                    >
                      Subscribe
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CourseDetail;
