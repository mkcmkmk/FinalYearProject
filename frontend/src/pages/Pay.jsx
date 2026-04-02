import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import axios from "axios";
import StudentTopNav from "../components/StudentTopNav";
import { getInstruments } from "../data/courseCatalog";
import "./Pay.css";

const plans = [
  { id: "monthly", name: "Monthly", price: 2500 },
  { id: "quarterly", name: "Quarterly", price: 4000 },
  { id: "yearly", name: "Yearly", price: 10000 },
];

const levels = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

const renderStars = (value) => "\u2605".repeat(value) + "\u2606".repeat(Math.max(0, 5 - value));

const Pay = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const instruments = useMemo(() => {
    const base = Array.from(
      new Set([...getInstruments(), "Drums", "Vocal", "Violin", "Saxophone"])
    );
    const incoming = String(state?.instrument || "").trim();
    return incoming && !base.includes(incoming) ? [...base, incoming] : base;
  }, [state]);

  const [selectedPlanId, setSelectedPlanId] = useState("monthly");
  const [selectedInstrument, setSelectedInstrument] = useState(instruments[0] || "Guitar");
  const [selectedLevel, setSelectedLevel] = useState("beginner");
  const [selectedTeacherId, setSelectedTeacherId] = useState(state?.teacherId || "");
  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const incomingPlan = state?.plan?.name;
    if (!incomingPlan) return;

    const found = plans.find(
      (plan) => plan.name.toLowerCase() === incomingPlan.toLowerCase()
    );
    if (found) setSelectedPlanId(found.id);
  }, [state]);

  useEffect(() => {
    if (state?.instrument) {
      setSelectedInstrument(state.instrument);
      return;
    }

    if (instruments.length) {
      setSelectedInstrument((current) => current || instruments[0]);
    }
  }, [instruments, state]);

  useEffect(() => {
    const loadTeachers = async () => {
      if (!token || !selectedInstrument) {
        setTeachers([]);
        return;
      }

      try {
        setTeachersLoading(true);
        setError(null);
        const res = await axios.get(
          `http://localhost:3000/api/users/teachers?instrument=${encodeURIComponent(selectedInstrument)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const nextTeachers = res.data?.teachers || [];
        setTeachers(nextTeachers);
        setSelectedTeacherId((current) => {
          if (
            state?.teacherId &&
            nextTeachers.some((teacher) => (teacher.id || teacher._id) === state.teacherId)
          ) {
            return state.teacherId;
          }
          if (nextTeachers.some((teacher) => (teacher.id || teacher._id) === current)) {
            return current;
          }
          return nextTeachers[0]?.id || nextTeachers[0]?._id || "";
        });
      } catch (err) {
        setTeachers([]);
        setError(err?.response?.data?.message || "Unable to load teachers");
      } finally {
        setTeachersLoading(false);
      }
    };

    loadTeachers();
  }, [selectedInstrument, token, state?.teacherId]);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || plans[0];
  const selectedLevelLabel = levels.find((level) => level.id === selectedLevel)?.label || "Beginner";
  const selectedTeacher = teachers.find((teacher) => (teacher.id || teacher._id) === selectedTeacherId) || null;

  const handlePay = async (event) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("You must be logged in to continue");
      return;
    }

    if (teachers.length > 0 && !selectedTeacherId) {
      setError("Please choose a teacher for this instrument");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        "http://localhost:3000/api/payment/subscribe",
        {
          plan: selectedPlanId,
          instrument: selectedInstrument,
          level: selectedLevel,
          teacherId: selectedTeacherId || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Subscription created successfully!");
      navigate("/profile");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pay-page">
      <StudentTopNav active="plans" />

      <div className="pay-shell">
        <div className="pay-card pay-card--main">
          <div className="pay-head">
            <div>
              <p className="pay-kicker">Enrollment</p>
              <h1 className="pay-title">Choose your plan</h1>
              <p className="pay-subtitle">
                Select your instrument, learning level, and teacher before confirming your subscription.
              </p>
            </div>
            <button
              className="pay-back pay-back--inline"
              type="button"
              onClick={() => navigate(state?.instrument ? -1 : "/student-dashboard")}
            >
              Back
            </button>
          </div>

          <p className="pay-user">
            Student: <b>{user?.name || "Guest"}</b>
          </p>

          {state?.courseName ? (
            <p className="pay-user">
              Course: <b>{state.courseName}</b>
            </p>
          ) : null}

          {error && <div className="pay-error">{error}</div>}

          <form onSubmit={handlePay} className="pay-form">
            <div className="pay-grid">
              <div className="pay-field">
                <label>Choose Subscription Plan</label>
                <select
                  value={selectedPlanId}
                  onChange={(event) => setSelectedPlanId(event.target.value)}
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - Rs {plan.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pay-field">
                <label>Choose Instrument</label>
                <select
                  value={selectedInstrument}
                  onChange={(event) => setSelectedInstrument(event.target.value)}
                >
                  {instruments.map((instrument) => (
                    <option key={instrument} value={instrument}>
                      {instrument}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pay-field pay-field--full">
                <label>Choose Level</label>
                <div className="pay-level-grid">
                  {levels.map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      className={selectedLevel === level.id ? "pay-level active" : "pay-level"}
                      onClick={() => setSelectedLevel(level.id)}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pay-teacher-section">
              <div className="pay-section-head">
                <div>
                  <h2>Pick your teacher</h2>
                  <p>Showing teachers who teach {selectedInstrument}.</p>
                </div>
              </div>

              {teachersLoading ? (
                <div className="pay-empty">Loading teachers...</div>
              ) : teachers.length === 0 ? (
                <div className="pay-empty">
                  No teachers are available for this instrument right now. You can still continue and be assigned later.
                </div>
              ) : (
                <div className="pay-teacher-grid">
                  {teachers.map((teacher) => {
                    const teacherId = teacher.id || teacher._id;
                    const ratingAverage = teacher.ratings?.averageRating || 0;
                    const totalRatings = teacher.ratings?.totalRatings || 0;
                    return (
                      <button
                        key={teacherId}
                        type="button"
                        className={selectedTeacherId === teacherId ? "pay-teacher-card active" : "pay-teacher-card"}
                        onClick={() => setSelectedTeacherId(teacherId)}
                      >
                        <div className="pay-teacher-top">
                          <div>
                            <strong>{teacher.name}</strong>
                            <span>{teacher.instrumentExpertise || selectedInstrument}</span>
                          </div>
                          <div className="pay-teacher-rating">
                            <b>{totalRatings ? ratingAverage.toFixed(1) : "New"}</b>
                            <span>
                              {totalRatings
                                ? `${renderStars(Math.round(ratingAverage))} (${totalRatings})`
                                : "No ratings yet"}
                            </span>
                          </div>
                        </div>
                        <div className="pay-teacher-meta">
                          <span>{teacher.yearsOfExperience ?? 0} years experience</span>
                          <span>{teacher.summary?.assignedStudents || 0} students</span>
                        </div>
                        <p>{teacher.teacherBio || "Teacher bio will be visible here soon."}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pay-summary">
              <p>
                <span>Selected Plan:</span>
                <b>{selectedPlan.name} (Rs {selectedPlan.price})</b>
              </p>
              <p>
                <span>Instrument:</span>
                <b>{selectedInstrument}</b>
              </p>
              <p>
                <span>Level:</span>
                <b>{selectedLevelLabel}</b>
              </p>
              <p>
                <span>Teacher:</span>
                <b>{selectedTeacher?.name || "Assign later"}</b>
              </p>
            </div>

            <button type="submit" className="pay-btn" disabled={loading}>
              {loading ? "Processing..." : "Confirm Subscription"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Pay;
