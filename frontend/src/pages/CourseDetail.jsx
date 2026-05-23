import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
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
      <StudentLayout>
        <div className="bg-white rounded-[2rem] p-8 shadow-sm text-center flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Course not found</h1>
          <p className="text-gray-500 mb-6">The instrument you selected is not available right now.</p>
          <button className="px-5 py-3 bg-[#1e1e1e] text-white rounded-[1.25rem] font-bold text-sm hover:bg-black transition-colors" onClick={() => navigate("/student-dashboard")}>
            Back to dashboard
          </button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="flex flex-col gap-4 h-full overflow-y-auto pr-2 custom-scrollbar pb-6">
        {/* Header Card */}
        <header className="bg-white rounded-[2rem] p-8 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1">Instrument Course</p>
            <h1 className="text-3xl font-extrabold text-gray-900 leading-none">{course.title}</h1>
            <p className="text-sm text-gray-500 mt-2 max-w-xl leading-relaxed">{course.description}</p>
          </div>

          <div className="flex gap-3">
            <button className="px-5 py-3 border-2 border-gray-100 rounded-[1.25rem] font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => navigate("/student-dashboard")}>
              Back
            </button>
            <button
              className="px-5 py-3 bg-[#1e1e1e] text-white rounded-[1.25rem] font-bold text-sm hover:bg-black transition-colors"
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

        {/* Hero Card */}
        <section className="bg-white rounded-[2rem] p-8 shadow-sm grid grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {[course.instrument, course.level, course.duration, course.classesPerWeek].map((chip, idx) => (
                <span key={idx} className="px-3.5 py-1.5 bg-[#f8f9fb] border border-gray-50 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider">
                  {chip}
                </span>
              ))}
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              This course is designed to help students build technique, consistency, and musical confidence with structured live classes and guided weekly practice.
            </p>
          </div>

          <div className="rounded-[1.5rem] overflow-hidden h-[180px] border border-gray-50">
            <img src={course.image} alt={course.instrument} className="w-full h-full object-cover" onError={setFallbackImage} />
          </div>
        </section>

        {/* Learning & Outcomes grid */}
        <section className="grid grid-cols-2 gap-4">
          <article className="bg-white rounded-[2rem] p-7 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">What you will learn</p>
            <h2 className="text-xl font-extrabold text-gray-800 mb-5">Course highlights</h2>
            <div className="space-y-3">
              {course.highlights.map((item, idx) => (
                <div className="flex items-start gap-2.5 text-sm font-semibold text-gray-600" key={idx}>
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="bg-white rounded-[2rem] p-7 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">After the course</p>
            <h2 className="text-xl font-extrabold text-gray-800 mb-5">Expected outcomes</h2>
            <div className="space-y-3">
              {course.outcomes.map((item, idx) => (
                <div className="flex items-start gap-2.5 text-sm font-semibold text-gray-600" key={idx}>
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        {/* Teachers Section */}
        <section className="bg-white rounded-[2rem] p-7 shadow-sm flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-gray-50 pb-4">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Teachers</p>
              <h2 className="text-xl font-extrabold text-gray-900">Available {course.instrument} teachers</h2>
            </div>
            <button
              className="px-5 py-3.5 border-2 border-gray-100 rounded-[1.25rem] font-bold text-xs text-gray-600 hover:bg-gray-50 transition-colors"
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

          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold">{error}</div>}

          {loadingTeachers ? (
            <div className="text-center py-10 text-gray-400 font-medium">Loading available teachers...</div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-bold text-sm bg-[#f8f9fb] rounded-[1.5rem] border-2 border-dashed border-gray-100">
              No teachers are currently available for this instrument.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {teachers.map((teacher) => (
                <div className="p-5 bg-[#f8f9fb] border border-gray-100 rounded-[1.5rem] flex flex-col justify-between gap-4" key={teacher.id || teacher._id}>
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 border-2 border-white flex items-center justify-center flex-shrink-0 shadow-inner">
                      {teacher.profileImage ? (
                        <img src={teacher.profileImage} alt={teacher.name} className="w-full h-full object-cover" onError={setFallbackImage} />
                      ) : (
                        <span className="text-lg font-bold text-gray-400">{teacher.name?.charAt(0)?.toUpperCase() || "T"}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-800 text-md leading-tight">{teacher.name}</h3>
                      <p className="text-xs text-gray-400 font-semibold mt-1 uppercase tracking-wider">{teacher.instrumentExpertise || course.instrument}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-[1.25rem] border border-gray-100/50 text-center text-xs font-bold">
                    <div className="flex flex-col justify-center border-r border-gray-50">
                      <span className="text-[10px] text-gray-400 uppercase mb-0.5">Experience</span>
                      <strong className="text-gray-800">{teacher.yearsOfExperience ?? 0} yrs</strong>
                    </div>
                    <div className="flex flex-col justify-center border-r border-gray-50">
                      <span className="text-[10px] text-gray-400 uppercase mb-0.5">Groups</span>
                      <strong className="text-gray-800">{teacher.summary?.groups || 0}</strong>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] text-gray-400 uppercase mb-0.5">Classes</span>
                      <strong className="text-gray-800">{teacher.summary?.weeklyClasses || 0}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 font-medium leading-relaxed italic pr-2">"{teacher.teacherBio || "I am passionate about teaching and helping students grow."}"</p>

                  <div className="flex gap-2.5 mt-2">
                    <button className="flex-1 py-3 border-2 border-gray-100 rounded-[1.25rem] font-bold text-xs text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => navigate(`/teachers/${teacher.id || teacher._id}`)}>
                      View profile
                    </button>
                    <button
                      className="flex-1 py-3 bg-[#1e1e1e] text-white rounded-[1.25rem] font-bold text-xs hover:bg-black transition-colors"
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
    </StudentLayout>
  );
};

export default CourseDetail;
