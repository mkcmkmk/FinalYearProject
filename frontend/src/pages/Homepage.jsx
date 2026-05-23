import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { COURSE_CATALOG } from "../data/courseCatalog";
import TeacherJoinForm from "../components/TeacherJoinForm";
import { useAuth } from "../context/authContext";
import "./Homepage.css";

const plans = [
  {
    name: "Monthly",
    price: "Rs 2500",
    detail: "Flexible weekly classes for students building momentum.",
  },
  {
    name: "Quarterly",
    price: "Rs 4000",
    detail: "A stronger value plan for consistent progress and live guidance.",
  },
  {
    name: "Yearly",
    price: "Rs 10000",
    detail: "Best for long-term growth from beginner foundations to performance confidence.",
  },
];

const features = [
  {
    title: "Live Group Learning",
    body: "Join real instrument groups, stay connected with teachers, and learn alongside classmates.",
  },
  {
    title: "Structured Practice",
    body: "Get class schedules, progress routines, and guided support that turns practice into habit.",
  },
  {
    title: "Teacher Matching",
    body: "Choose from teachers by instrument, experience, and rating before you subscribe.",
  },
];

const roleCards = [
  {
    title: "Students",
    body: "Discover instrument courses, subscribe, join groups, chat with classmates, and rate your teacher.",
  },
  {
    title: "Teachers",
    body: "Manage student groups, create schedules, and lead focused class communities by expertise.",
  },
  {
    title: "Admins",
    body: "Monitor subscriptions, review teachers, manage users, and keep the full music school running smoothly.",
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const featuredCourses = useMemo(() => COURSE_CATALOG.slice(0, 4), []);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const getDashboardPath = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin-dashboard";
    if (user.role === "teacher") return "/teacher-dashboard";
    return "/student-dashboard";
  };

  useEffect(() => {
    if (location.state?.paymentSuccess) {
      setShowSuccessPopup(true);
      // Clean up the state so it doesn't show again on reload
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <div className="landing-page">
      <header className="sticky top-6 z-50 flex items-center justify-between gap-5 px-6 py-3 mx-auto max-w-[1240px] bg-white/90 backdrop-blur-xl border border-gray-100 rounded-[2rem] shadow-sm transition-all hover:bg-white/95">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-10 h-10 bg-green-200 rounded-[14px] flex items-center justify-center text-green-900 font-extrabold text-xl">
            H
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900">Harmoniq</span>
        </div>

        <nav className="flex-1 flex items-center gap-8 justify-center hidden md:flex">
          <a href="#features" className="text-[15px] font-bold text-gray-500 hover:text-gray-900 transition-colors no-underline">Why Harmoniq</a>
          <a href="#courses" className="text-[15px] font-bold text-gray-500 hover:text-gray-900 transition-colors no-underline">Courses</a>
          <a href="#plans" className="text-[15px] font-bold text-gray-500 hover:text-gray-900 transition-colors no-underline">Plans</a>
          <a href="#roles" className="text-[15px] font-bold text-gray-500 hover:text-gray-900 transition-colors no-underline">Platform</a>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <button 
              type="button" 
              className="px-5 py-2.5 bg-[#1e1e1e] hover:bg-black text-white rounded-[1.25rem] font-bold text-[15px] transition-all cursor-pointer shadow-sm border-none" 
              onClick={() => navigate(getDashboardPath())}
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <button type="button" className="px-5 py-2.5 rounded-[1.25rem] font-bold text-[15px] text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent" onClick={() => navigate("/login")}>Log In</button>
              <button type="button" className="px-5 py-2.5 bg-[#1e1e1e] hover:bg-black text-white rounded-[1.25rem] font-bold text-[15px] transition-all cursor-pointer shadow-sm border-none" onClick={() => navigate("/signup")}>Get Started</button>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <div 
              onClick={() => document.getElementById('join-teacher')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.06)",
                padding: "6px 12px 6px 6px",
                borderRadius: "100px",
                fontSize: "13.5px",
                fontWeight: "500",
                marginBottom: "28px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)";
              }}
            >
              <span style={{ 
                background: "#2b6fff", 
                color: "#ffffff",
                padding: "3px 10px",
                borderRadius: "100px",
                fontWeight: "700",
                fontSize: "11px",
                letterSpacing: "0.5px"
              }}>NEW</span>
              <span style={{ color: "#334155" }}>We're hiring music teachers</span>
              <span style={{ color: "#94a3b8", marginLeft: "-4px" }}>&rarr;</span>
            </div>
            
            <p className="landing-kicker">Music school, class management, and community in one place</p>
            <h1>Learn music with live classes, better structure, and real group connection.</h1>
            <p className="landing-lead">
              Harmoniq brings together students, teachers, schedules, subscriptions, and group chat so every class feels connected from signup to performance.
            </p>

            <div className="landing-hero-actions">
              <button type="button" className="btn btn-primary" onClick={() => navigate("/signup")}>Create Account</button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate("/login")}>Explore Dashboard Access</button>
            </div>

            <div className="landing-stats">
              <div>
                <strong>8+</strong>
                <span>instruments offered</span>
              </div>
              <div>
                <strong>Live</strong>
                <span>group class chat</span>
              </div>
              <div>
                <strong>Weekly</strong>
                <span>teacher schedules</span>
              </div>
            </div>
          </div>

          <div className="landing-hero-panel">
            <div className="landing-panel-card landing-panel-card--primary">
              <span>Student Flow</span>
              <strong>Browse courses, choose a teacher, subscribe, and join your group.</strong>
            </div>
            <div className="landing-panel-grid">
              <div className="landing-panel-card">
                <span>Teacher Tools</span>
                <strong>Create groups and design weekly class schedules.</strong>
              </div>
              <div className="landing-panel-card">
                <span>Admin View</span>
                <strong>Track subscriptions, approvals, and school activity from one dashboard.</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="landing-section-head">
            <p className="landing-kicker">Why Harmoniq</p>
            <h2>A cleaner way to run and join music classes</h2>
          </div>

          <div className="landing-feature-grid">
            {features.map((feature) => (
              <article className="card" key={feature.title}>
                <div className="card-header">
                  <h3>{feature.title}</h3>
                </div>
                <div className="card-body">
                  <p>{feature.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" id="courses">
          <div className="landing-section-head landing-section-head--split">
            <div>
              <p className="landing-kicker">Featured Instruments</p>
              <h2>Start with the instrument that fits your voice and style</h2>
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => navigate("/signup")}>View All After Signup</button>
          </div>

          <div className="landing-course-grid">
            {featuredCourses.map((course) => (
              <article className="landing-course-card" key={course.slug}>
                <img src={course.image} alt={course.instrument} />
                <div className="landing-course-copy">
                  <div>
                    <span className="badge badge-primary" style={{ marginBottom: '8px' }}>{course.instrument}</span>
                    <h3>{course.title}</h3>
                  </div>
                  <p>{course.shortDescription}</p>
                  <span>{course.classesPerWeek}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" id="plans">
          <div className="landing-section-head">
            <p className="landing-kicker">Plans</p>
            <h2>Flexible subscriptions for every stage of learning</h2>
          </div>

          <div className="landing-plan-grid">
            {plans.map((plan, index) => (
              <article className={index === 1 ? "card landing-card--featured" : "card"} key={plan.name}>
                <div className="card-header">
                  <h3>{plan.name}</h3>
                </div>
                <div className="card-body">
                  <strong style={{ display: 'block', fontSize: '1.5rem', marginBottom: '14px' }}>{plan.price}</strong>
                  <p>{plan.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" id="roles">
          <div className="landing-section-head">
            <p className="landing-kicker">Platform Roles</p>
            <h2>Built for students, teachers, and school admins</h2>
          </div>

          <div className="landing-role-grid">
            {roleCards.map((role) => (
              <article className="card landing-card--soft" key={role.title}>
                <div className="card-header">
                  <h3>{role.title}</h3>
                </div>
                <div className="card-body">
                  <p>{role.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" id="join-teacher">
          <div className="landing-section-head">
            <p className="landing-kicker">Teach With Us</p>
            <h2>Share your expertise and build your class community</h2>
          </div>
          <TeacherJoinForm />
        </section>

        <section className="landing-cta">
          <div>
            <p className="landing-kicker">Ready to begin?</p>
            <h2>Join Harmoniq and turn music learning into a consistent routine.</h2>
          </div>
          <div className="landing-actions landing-actions--cta">
            <button type="button" className="btn btn-primary" onClick={() => navigate("/signup")}>Sign Up</button>
            <button type="button" className="btn btn-ghost" style={{ borderColor: 'transparent', color: '#fff' }} onClick={() => navigate("/login")}>Already have an account?</button>
          </div>
        </section>
      </main>

      {showSuccessPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-xl animate-fade-in">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment successfully!</h2>
            <p className="text-gray-500 mb-6 font-medium">Thank you for subscription.</p>
            <button
              onClick={() => {
                setShowSuccessPopup(false);
                navigate(getDashboardPath());
              }}
              className="w-full py-3.5 bg-[#1e1e1e] text-white rounded-[1.25rem] font-bold hover:bg-black transition-colors"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
