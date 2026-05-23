import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import axios from "axios";
import StudentLayout from "../components/StudentLayout";
import { getInstruments } from "../data/courseCatalog";
import InfiniteMenu from "../components/InfiniteMenu";
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

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
  const [activeTab, setActiveTab] = useState("pay"); // "pay" or "statements"
  const [statements, setStatements] = useState([]);
  const [statementsLoading, setStatementsLoading] = useState(false);

  const fetchStatements = async () => {
    if (!token) return;
    try {
      setStatementsLoading(true);
      const res = await axios.get(`${API_BASE}/api/payment/statements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatements(res.data?.payments || []);
    } catch (err) {
      console.error("Error fetching statements:", err);
    } finally {
      setStatementsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "statements") {
      fetchStatements();
    }
  }, [activeTab]);


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
          `${API_BASE}/api/users/teachers?instrument=${encodeURIComponent(selectedInstrument)}`,
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

  const menuItems = useMemo(() => {
    return teachers.map((t) => ({
      id: t.id || t._id,
      image: t.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&h=400&fit=crop",
      title: t.name,
      description: `★ ${t.ratings?.averageRating?.toFixed(1) || "5.0"} (${t.ratings?.totalRatings || 0} reviews) • ${t.yearsOfExperience || 0} yrs exp`,
      link: "#"
    }));
  }, [teachers]);

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
      const res = await axios.post(
        `${API_BASE}/api/payment/subscribe`,
        {
          plan: selectedPlanId,
          instrument: selectedInstrument,
          level: selectedLevel,
          teacherId: selectedTeacherId || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.payment_url) {
        window.location.href = res.data.payment_url;
      } else {
        alert("Subscription created successfully!");
        navigate("/profile");
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Payment failed");
      setLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="flex gap-4 h-full overflow-hidden">
        {/* Left Column - Main checkout form */}
        <main className="w-[60%] bg-white rounded-[2rem] p-8 shadow-sm flex flex-col overflow-hidden h-full">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1">Membership Plan</p>
              <h1 className="text-2xl font-extrabold text-gray-900">Choose your program</h1>
              <p className="text-sm text-gray-500 mt-1">Select an instrument, level, and pick a preferred teacher.</p>
            </div>
            <button className="px-5 py-3 border-2 border-gray-100 rounded-[1.25rem] font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors" type="button" onClick={() => navigate(state?.instrument ? -1 : "/student-dashboard")}>
              Back
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex p-1 bg-gray-50 rounded-[1.25rem] border border-gray-100 mb-6 shrink-0">
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-bold rounded-[1rem] transition-all ${
                activeTab === "pay"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("pay")}
            >
              New Payment
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-bold rounded-[1rem] transition-all ${
                activeTab === "statements"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              onClick={() => {
                setActiveTab("statements");
                setError(null);
              }}
            >
              View Statements
            </button>
          </div>

          {error && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-2xl font-bold text-sm shrink-0">{error}</div>}

          {activeTab === "statements" ? (
            <div className="flex-1 flex flex-col overflow-y-auto pr-2 custom-scrollbar space-y-4">
              <div className="mb-2 shrink-0">
                <h2 className="text-lg font-bold text-[#1e1e1e]">Your Transaction History</h2>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                  View your recent membership payments and current status.
                </p>
              </div>

              {statementsLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400 font-medium">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                  Loading payment statements...
                </div>
              ) : statements.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400 font-bold bg-[#f8f9fb] rounded-[1.5rem] border-2 border-dashed border-gray-100 text-sm">
                  <span className="text-4xl mb-2">💳</span>
                  No payment statements found.
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {statements.map((stmt) => (
                    <div
                      key={stmt._id}
                      className="bg-white border-2 border-gray-50 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 relative overflow-hidden"
                    >
                      {/* Top Header Row of Statement */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-purple-50 rounded-2xl">
                            <span className="text-xl">🎵</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-gray-900 text-sm">
                                {stmt.orderId?.instrument || "HarmoniQ Program"}
                              </h3>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                stmt.status === "PAID"
                                  ? "bg-green-50 text-green-600 border border-green-100"
                                  : stmt.status === "PENDING"
                                  ? "bg-amber-50 text-amber-600 border border-amber-100"
                                  : "bg-red-50 text-red-600 border border-red-100"
                              }`}>
                                {stmt.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                              TXID: {stmt.transaction_uuid}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-gray-900">
                            Rs {stmt.total_amount || stmt.amount}
                          </p>
                          <p className="text-[9px] text-gray-400 font-bold mt-0.5">
                            {stmt.completed_at ? new Date(stmt.completed_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }) : new Date(stmt.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Detailed grid inside each Statement */}
                      <div className="grid grid-cols-3 gap-2 bg-[#f8f9fb] rounded-2xl p-4 text-[12px] font-semibold text-gray-600">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Plan</span>
                          <span className="text-gray-800 capitalize font-extrabold">{stmt.orderId?.plan || "Monthly"}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Proficiency</span>
                          <span className="text-gray-800 capitalize font-extrabold">{stmt.orderId?.level || "Beginner"}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Instructor</span>
                          <span className="text-gray-800 font-extrabold">
                            {stmt.orderId?.teacher?.name || "Auto assigned"}
                          </span>
                        </div>
                      </div>

                      {/* Explicit student name confirmation display */}
                      <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-50 pt-3">
                        <span>Payer Name:</span>
                        <strong className="text-gray-700 font-extrabold">{stmt.studentName || "Guest Student"}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handlePay} className="flex-1 flex flex-col justify-between overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-6">
                {/* Select Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-gray-500">Subscription Plan</label>
                    <select className="px-4 py-3.5 border-2 border-gray-100 rounded-[1.25rem] text-sm font-bold bg-[#f8f9fb] focus:outline-none focus:border-black transition-colors" value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)}>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} - Rs {plan.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-gray-500">Learning Instrument</label>
                    <select className="px-4 py-3.5 border-2 border-gray-100 rounded-[1.25rem] text-sm font-bold bg-[#f8f9fb] focus:outline-none focus:border-black transition-colors" value={selectedInstrument} onChange={(event) => setSelectedInstrument(event.target.value)}>
                      {instruments.map((instrument) => (
                        <option key={instrument} value={instrument}>
                          {instrument}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Level Selector */}
                <div className="flex flex-col gap-2.5">
                  <label className="text-[13px] font-bold text-gray-500">Learning Level</label>
                  <div className="flex gap-2">
                    {levels.map((level) => (
                      <button key={level.id} type="button" className={`flex-1 py-3.5 rounded-[1.25rem] text-sm font-bold border-2 transition-colors ${
                        selectedLevel === level.id ? "bg-[#1e1e1e] text-white border-[#1e1e1e]" : "border-gray-100 text-gray-600 hover:bg-gray-50"
                      }`} onClick={() => setSelectedLevel(level.id)}>
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Teacher Selector list inside main layout */}
                <div className="flex flex-col gap-2.5 mt-2">
                  <div className="mb-2">
                    <h2 className="text-md font-bold text-gray-900">Choose your instructor</h2>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">Showing instructors who specialize in {selectedInstrument}.</p>
                  </div>

                  {teachersLoading ? (
                    <div className="text-center py-6 text-gray-400 font-medium bg-[#f8f9fb] rounded-[1.5rem]">Loading teachers...</div>
                  ) : teachers.length === 0 ? (
                    <div className="text-center p-6 text-gray-400 font-bold bg-[#f8f9fb] rounded-[1.5rem] border-2 border-dashed border-gray-100 text-sm">
                      No active teachers available for {selectedInstrument} currently. You will be auto-assigned later.
                    </div>
                  ) : (
                    <div className="bg-[#0e0e0e] text-white rounded-[2.25rem] p-6 shadow-md overflow-hidden flex flex-col relative h-[360px] border border-white/5">
                      {selectedTeacher && (
                        <div className="absolute top-6 left-6 z-20 pointer-events-none bg-black/60 backdrop-blur-sm py-1.5 px-3.5 rounded-full border border-white/10">
                          <span className="text-[11px] font-bold text-green-400 tracking-wide uppercase">Active Selection: {selectedTeacher.name}</span>
                        </div>
                      )}
                      <div className="flex-1 w-full h-full relative animate-fade-in" style={{ minHeight: "260px" }}>
                        <InfiniteMenu 
                          items={menuItems} 
                          scale={0.8} 
                          onItemClick={(item) => setSelectedTeacherId(item.id)} 
                          buttonIcon="✓" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="w-full mt-8 py-4 bg-[#1e1e1e] text-white rounded-[1.25rem] font-bold text-sm hover:bg-black transition-colors" disabled={loading}>
                {loading ? "Creating membership..." : "Confirm Subscription"}
              </button>
            </form>
          )}
        </main>

        {/* Right Column - Summary & details */}
        <aside className="flex-1 bg-[#1e1e1e] text-white rounded-[2rem] p-8 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h2 className="text-xl font-extrabold mb-8 tracking-tight">Summary of details</h2>
            <div className="space-y-6">
              <div className="flex flex-col gap-1 border-b border-white/10 pb-4">
                <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Enrolled Student</span>
                <strong className="text-md font-bold">{user?.name || "Guest Student"}</strong>
              </div>
              <div className="flex flex-col gap-1 border-b border-white/10 pb-4">
                <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Selected Membership</span>
                <strong className="text-md font-bold text-green-300">{selectedPlan.name} Plan (Rs {selectedPlan.price})</strong>
              </div>
              <div className="flex flex-col gap-1 border-b border-white/10 pb-4">
                <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Subject / Instrument</span>
                <strong className="text-md font-bold">{selectedInstrument}</strong>
              </div>
              <div className="flex flex-col gap-1 border-b border-white/10 pb-4">
                <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Proficiency Target</span>
                <strong className="text-md font-bold">{selectedLevelLabel}</strong>
              </div>
              <div className="flex flex-col gap-1 border-b border-white/10 pb-4">
                <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Selected Teacher</span>
                <strong className="text-md font-bold text-blue-200">{selectedTeacher?.name || "Auto assigned later"}</strong>
              </div>
            </div>
          </div>

          <div className="text-[12px] text-white/30 font-medium leading-relaxed pt-6">
            By creating a membership, you agree to access live scheduled sessions and classroom group chats.
          </div>
        </aside>
      </div>
    </StudentLayout>
  );
};

export default Pay;
