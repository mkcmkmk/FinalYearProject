import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import StudentLayout from "../components/StudentLayout";
import "./StudentSchedule.css";

const normalizeStatus = (value) => {
  const next = String(value || "").trim().toLowerCase();
  if (["active", "paid", "subscribed", "success"].includes(next)) return "active";
  if (["pending", "processing"].includes(next)) return "pending";
  if (["expired", "inactive", "canceled", "cancelled"].includes(next)) return "expired";
  return "none";
};

const StudentSchedule = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    let mounted = true;
    const loadSchedule = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (!mounted) return;
        setError("Please log in to view your class schedule.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await axios.get("http://localhost:3000/api/subscriptions/me/schedule", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        setSubscription(response.data?.subscription || null);
        setSchedules(Array.isArray(response.data?.schedules) ? response.data.schedules : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || "Unable to load your schedule right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSchedule();
    return () => { mounted = false; };
  }, []);

  const status = normalizeStatus(subscription?.status);
  const summary = useMemo(
    () => ({
      instrument: subscription?.instrument || "Not subscribed",
      level: subscription?.level || "-",
      groupName: subscription?.groupName || "Not assigned",
      teacherName: subscription?.teacherName || "Unassigned",
    }),
    [subscription]
  );

  return (
    <StudentLayout>
      <div className="flex flex-col gap-4 h-full overflow-hidden">
        {/* Timetable Header Card */}
        <section className="bg-white rounded-[2rem] p-6 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1">Student Timetable</p>
            <h1 className="text-2xl font-extrabold text-gray-900">Your class schedule</h1>
            <p className="text-sm text-gray-500 mt-1">
              View your group schedule, teacher details, and weekly timing.
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" className="px-5 py-3 border-2 border-gray-100 rounded-[1.25rem] font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => navigate("/student-dashboard")}>
              Dashboard
            </button>
            <button type="button" className="px-5 py-3 bg-[#1e1e1e] text-white rounded-[1.25rem] font-bold text-sm hover:bg-black transition-colors" onClick={() => navigate("/chat")}>
              Open Group Chat
            </button>
          </div>
        </section>

        {error && <div className="p-4 bg-red-100 text-red-700 rounded-2xl font-semibold text-sm">{error}</div>}

        {/* Info Grid (Boxy cards) */}
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: "Student", val: user?.name || "Student" },
            { label: "Instrument", val: summary.instrument },
            { label: "Level", val: summary.level },
            { label: "Teacher", val: summary.teacherName },
            { label: "Group", val: summary.groupName },
            { label: "Status", val: status, isPill: true },
          ].map((item, idx) => (
            <article key={idx} className="bg-white rounded-[1.5rem] p-5 shadow-sm flex flex-col justify-center min-w-0">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 block truncate">{item.label}</span>
              {item.isPill ? (
                <strong className={`inline-block w-fit px-3 py-1 rounded-full text-xs font-bold capitalize ${
                  status === "active" ? "bg-green-100 text-green-700" :
                  status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                }`}>
                  {item.val}
                </strong>
              ) : (
                <strong className="text-[15px] font-extrabold text-gray-800 leading-tight block truncate" title={item.val}>{item.val}</strong>
              )}
            </article>
          ))}
        </section>

        {/* Schedule Grid Table */}
        <section className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm overflow-hidden flex flex-col">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Weekly schedule</h2>
            <p className="text-sm text-gray-400">Class times for your assigned teaching group.</p>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">Loading your timetable...</div>
          ) : schedules.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
              <div className="text-gray-400 font-medium">
                <p>No class schedule is available yet for your current subscription.</p>
                <p className="text-sm mt-1">Once assigned to a group, your schedule will show here.</p>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" className="px-5 py-3 border-2 border-gray-100 rounded-[1.25rem] font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => navigate("/profile")}>
                  View Profile
                </button>
                <button type="button" className="px-5 py-3 bg-[#1e1e1e] text-white rounded-[1.25rem] font-bold text-sm hover:bg-black transition-colors" onClick={() => navigate("/pay")}>
                  Manage Subscription
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-7 text-[13px] font-bold text-gray-400 mb-4 px-4">
                <div>Day</div>
                <div className="col-span-2">Time</div>
                <div>Instrument</div>
                <div>Group</div>
                <div>Teacher</div>
                <div>Room</div>
              </div>

              <div className="space-y-2">
                {schedules.map((slot) => (
                  <div key={slot.id} className="grid grid-cols-7 items-center bg-[#f8f9fb] rounded-[1.25rem] p-4 text-[14px] font-bold">
                    <div className="text-gray-900">{slot.dayOfWeek}</div>
                    <div className="col-span-2 text-gray-600">{slot.startTime} - {slot.endTime}</div>
                    <div className="text-gray-900">{slot.instrument || summary.instrument}</div>
                    <div className="text-gray-600">{slot.groupName || summary.groupName}</div>
                    <div className="text-gray-900">{summary.teacherName}</div>
                    <div className="text-gray-600">{slot.room || "-"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </StudentLayout>
  );
};

export default StudentSchedule;
