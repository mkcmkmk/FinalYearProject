import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import TeacherLayout from "../components/TeacherLayout";
import "./TeacherDashboard.css";

const API_BASE = "http://localhost:3000/api/teacher";
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const emptyAssignmentForm = {
  groupName: "",
  instrument: "",
  capacity: 8,
};

const emptyScheduleForm = {
  groupId: "",
  dayOfWeek: "Monday",
  startTime: "15:00",
  endTime: "16:00",
  room: "",
  notes: "",
};

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingGroup, setSavingGroup] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  
  // Reassignment state
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedStudentForReassign, setSelectedStudentForReassign] = useState(null);
  const [reassigningStudentId, setReassigningStudentId] = useState(null);
  const [selectedNewGroupId, setSelectedNewGroupId] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const teacherInstrument =
    dashboard?.expertiseInstruments?.[0] || dashboard?.teacher?.instrumentExpertise || "";

  const loadDashboard = async () => {
    if (!token) {
      setError("Please log in first.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/dashboard`, authHeaders);
      const data = res.data;
      const expertiseInstrument =
        data?.expertiseInstruments?.[0] || data?.teacher?.instrumentExpertise || "";

      setDashboard(data);
      setAssignmentForm((prev) => ({
        ...prev,
        instrument: expertiseInstrument || prev.instrument,
      }));

      if (data.groups?.length && !scheduleForm.groupId) {
        setScheduleForm((prev) => ({ ...prev, groupId: data.groups[0]._id }));
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load teacher dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const toggleStudent = (subscriptionId) => {
    setSelectedStudents((prev) =>
      prev.includes(subscriptionId)
        ? prev.filter((id) => id !== subscriptionId)
        : [...prev, subscriptionId]
    );
  };

  const handleAssignStudents = async (event) => {
    event.preventDefault();
    setSavingGroup(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(
        `${API_BASE}/groups/assign`,
        {
          subscriptionIds: selectedStudents,
          groupName: assignmentForm.groupName,
          instrument: teacherInstrument || assignmentForm.instrument,
          capacity: Number(assignmentForm.capacity),
        },
        authHeaders
      );

      setMessage(res.data.message || "Students assigned successfully");
      setSelectedStudents([]);
      setAssignmentForm((prev) => ({
        ...emptyAssignmentForm,
        instrument: teacherInstrument || prev.instrument,
      }));
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to assign students");
    } finally {
      setSavingGroup(false);
    }
  };

  const handleCreateSchedule = async (event) => {
    event.preventDefault();
    setSavingSchedule(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(`${API_BASE}/schedules`, scheduleForm, authHeaders);
      setMessage(res.data.message || "Class schedule created");
      setScheduleForm((prev) => ({ ...emptyScheduleForm, groupId: prev.groupId }));
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create schedule");
    } finally {
      setSavingSchedule(false);
    }
  };

  const openReassignModal = (student) => {
    setSelectedStudentForReassign(student);
    setSelectedNewGroupId("");
    setShowReassignModal(true);
  };

  const handleReassignStudent = async () => {
    if (!selectedStudentForReassign || !selectedNewGroupId) {
      setError("Please select a target group");
      return;
    }

    setReassigningStudentId(selectedStudentForReassign._id);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(
        `${API_BASE}/groups/reassign`,
        {
          subscriptionId: selectedStudentForReassign._id,
          newGroupId: selectedNewGroupId,
        },
        authHeaders
      );

      setMessage(res.data.message || "Student reassigned successfully");
      setShowReassignModal(false);
      setSelectedStudentForReassign(null);
      setSelectedNewGroupId("");
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to reassign student");
    } finally {
      setReassigningStudentId(null);
    }
  };

  const groupedSchedules = useMemo(() => {
    const entries = dashboard?.schedules || [];
    return DAYS.map((day) => ({
      day,
      items: entries.filter((entry) => entry.dayOfWeek === day),
    })).filter((section) => section.items.length > 0);
  }, [dashboard]);

  const studentPool = dashboard?.studentPool || [];

  if (loading) {
    return (
      <TeacherLayout>
        <div className="bg-white rounded-[2rem] p-8 shadow-sm text-center flex items-center justify-center h-full text-gray-400 font-bold text-sm">
          Loading teacher dashboard...
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="flex flex-col gap-4 h-full overflow-y-auto pt-4 pr-2 custom-scrollbar pb-6">
        
        {/* Welcome Card */}
        <header className="bg-white rounded-[2rem] p-10 shadow-sm flex flex-col gap-2 justify-center relative overflow-hidden border border-gray-50/50">
          <p className="text-[11px] font-bold text-purple-500 uppercase tracking-widest mb-0">Teacher Dashboard</p>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">Welcome back, {user?.name || dashboard?.teacher?.name || "Teacher"}</h1>
          <p className="text-xs text-gray-400 font-semibold max-w-2xl leading-snug">
            Manage student placements, schedule training sessions, and view active ensemble groups.
          </p>
        </header>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-[1.25rem] text-xs font-bold">{error}</div>}
        {message && <div className="p-4 bg-green-50 text-green-600 rounded-[1.25rem] text-xs font-bold">{message}</div>}

        {/* Stats Strip */}
        <section className="grid grid-cols-4 gap-4">
          {[
            { label: "Total groups", value: dashboard?.summary?.totalGroups || 0, color: "text-blue-500" },
            { label: "Assigned students", value: dashboard?.summary?.totalStudents || 0, color: "text-green-500" },
            { label: "Waiting for group", value: dashboard?.summary?.unassignedStudents || 0, color: "text-yellow-500" },
            { label: "Weekly classes", value: dashboard?.summary?.totalSchedules || 0, color: "text-purple-500" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between gap-1.5 border border-gray-50/50">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stat.label}</span>
              <strong className="text-3xl font-extrabold text-gray-900 leading-none">{stat.value}</strong>
            </div>
          ))}
        </section>

        {/* Action Panel Grid (Placements & Schedules) */}
        <section className="grid grid-cols-2 gap-4">
          
          {/* Column 1: Student Placement */}
          <article className="bg-white rounded-[2rem] p-7 shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Student Placement</p>
                <h2 className="text-xl font-extrabold text-gray-900">Assign Students</h2>
              </div>
              <span className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-xs font-bold">
                {selectedStudents.length} selected
              </span>
            </div>

            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {studentPool.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-bold text-xs bg-[#f8f9fb] rounded-[1.5rem] border border-gray-50">
                  No active students are waiting for placement.
                </div>
              ) : (
                studentPool.map((subscription) => (
                  <label 
                    key={subscription._id} 
                    className={`flex items-center gap-4 p-3.5 bg-[#f8f9fb] hover:bg-gray-100/70 border rounded-[1.25rem] cursor-pointer transition-all ${
                      selectedStudents.includes(subscription._id) ? "border-purple-200 bg-purple-50/20" : "border-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4.5 h-4.5 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                      checked={selectedStudents.includes(subscription._id)}
                      onChange={() => toggleStudent(subscription._id)}
                    />
                    <div className="flex-1 min-w-0">
                      <strong className="text-sm font-bold text-gray-800 block truncate">{subscription.user?.name || "Student"}</strong>
                      <span className="text-[11px] text-gray-400 font-semibold block mt-0.5">
                        Group: {subscription.currentGroupName || "None"} · {subscription.assignmentState}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-wider flex-shrink-0">
                      {subscription.instrument}
                    </span>
                  </label>
                ))
              )}
            </div>

            <form className="space-y-4 pt-2" onSubmit={handleAssignStudents}>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Group Name</label>
                  <input
                    value={assignmentForm.groupName}
                    onChange={(event) =>
                      setAssignmentForm((prev) => ({ ...prev, groupName: event.target.value }))
                    }
                    className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold placeholder-gray-300 focus:outline-none focus:border-gray-200"
                    placeholder="Beginner Piano A"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Instrument</label>
                  <input
                    value={teacherInstrument || assignmentForm.instrument}
                    onChange={(event) =>
                      setAssignmentForm((prev) => ({ ...prev, instrument: event.target.value }))
                    }
                    className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold placeholder-gray-300 focus:outline-none focus:border-gray-200"
                    placeholder="Piano"
                    readOnly={Boolean(teacherInstrument)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={assignmentForm.capacity}
                    onChange={(event) =>
                      setAssignmentForm((prev) => ({ ...prev, capacity: event.target.value }))
                    }
                    className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold focus:outline-none focus:border-gray-200"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={savingGroup || selectedStudents.length === 0}
                className="w-full py-3.5 bg-[#1e1e1e] hover:bg-black text-white disabled:bg-gray-100 disabled:text-gray-400 rounded-[1.25rem] text-xs font-bold tracking-wider uppercase transition-colors"
              >
                {savingGroup ? "Saving group..." : "Assign selected students"}
              </button>
            </form>
          </article>

          {/* Column 2: Schedule Design */}
          <article className="bg-white rounded-[2rem] p-7 shadow-sm flex flex-col gap-6">
            <div className="border-b border-gray-50 pb-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Schedule Design</p>
              <h2 className="text-xl font-extrabold text-gray-900">Create Class Slot</h2>
            </div>

            <form className="space-y-4 flex-1 flex flex-col justify-between" onSubmit={handleCreateSchedule}>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Group</label>
                  <select
                    value={scheduleForm.groupId}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({ ...prev, groupId: event.target.value }))
                    }
                    className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold focus:outline-none focus:border-gray-200 cursor-pointer"
                    required
                  >
                    <option value="">Select a group</option>
                    {(dashboard?.groups || []).map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.groupName} ({group.instrument})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Day</label>
                  <select
                    value={scheduleForm.dayOfWeek}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({ ...prev, dayOfWeek: event.target.value }))
                    }
                    className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold focus:outline-none focus:border-gray-200 cursor-pointer"
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Room</label>
                  <input
                    value={scheduleForm.room}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({ ...prev, room: event.target.value }))
                    }
                    className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold placeholder-gray-300 focus:outline-none focus:border-gray-200"
                    placeholder="Studio 2"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Start Time</label>
                  <input
                    type="time"
                    value={scheduleForm.startTime}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({ ...prev, startTime: event.target.value }))
                    }
                    className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold focus:outline-none focus:border-gray-200 cursor-pointer"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">End Time</label>
                  <input
                    type="time"
                    value={scheduleForm.endTime}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({ ...prev, endTime: event.target.value }))
                    }
                    className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold focus:outline-none focus:border-gray-200 cursor-pointer"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Notes</label>
                  <textarea
                    value={scheduleForm.notes}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({ ...prev, notes: event.target.value }))
                    }
                    className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold placeholder-gray-300 focus:outline-none focus:border-gray-200 resize-none"
                    placeholder="Focus on chord transitions and ensemble timing"
                    rows="2"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={savingSchedule || !scheduleForm.groupId}
                className="w-full mt-4 py-3.5 bg-[#1e1e1e] hover:bg-black text-white disabled:bg-gray-100 disabled:text-gray-400 rounded-[1.25rem] text-xs font-bold tracking-wider uppercase transition-colors"
              >
                {savingSchedule ? "Saving schedule..." : "Create class slot"}
              </button>
            </form>
          </article>
        </section>

        {/* Bottom Grid (Active Groups & Weekly schedules) */}
        <section className="grid grid-cols-2 gap-4">
          
          {/* Active Groups overview */}
          <article className="bg-white rounded-[2rem] p-7 shadow-sm flex flex-col gap-6">
            <div className="border-b border-gray-50 pb-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Group Overview</p>
              <h2 className="text-xl font-extrabold text-gray-900">Your Active Groups</h2>
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              {(dashboard?.groups || []).length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-bold text-xs bg-[#f8f9fb] rounded-[1.5rem] border border-gray-50">
                  No active groups yet. Create one above!
                </div>
              ) : (
                dashboard.groups.map((group) => (
                  <div className="p-5 bg-[#f8f9fb] border border-gray-100 rounded-[1.5rem] flex flex-col gap-4" key={group._id}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-extrabold text-gray-800 text-md leading-tight">{group.groupName}</h3>
                        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">{group.instrument}</span>
                      </div>
                      <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-xs font-bold text-gray-600">
                        {group.filled}/{group.capacity} students
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/50">
                      {group.students?.length ? (
                        group.students.map((student) => (
                          <div className="bg-white p-2.5 rounded-[1rem] border border-gray-100/50 flex flex-col gap-2 group/student" key={student._id}>
                            <div>
                              <strong className="text-xs font-bold text-gray-700 block truncate">{student.user?.name || "Student"}</strong>
                              <span className="text-[10px] text-gray-400 font-semibold block truncate mt-0.5">{student.user?.email}</span>
                            </div>
                            <button
                              onClick={() => openReassignModal(student)}
                              className="text-[9px] font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition-colors text-left"
                            >
                              ↔ Reassign
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-4 text-xs font-bold text-gray-400">No students in this group yet.</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          {/* Weekly plan board */}
          <article className="bg-white rounded-[2rem] p-7 shadow-sm flex flex-col gap-6">
            <div className="border-b border-gray-50 pb-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Weekly Plan</p>
              <h2 className="text-xl font-extrabold text-gray-900">Scheduled Classes</h2>
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              {groupedSchedules.length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-bold text-xs bg-[#f8f9fb] rounded-[1.5rem] border border-gray-50">
                  No scheduled classes yet. Design your timetable above!
                </div>
              ) : (
                groupedSchedules.map((section) => (
                  <div className="space-y-2.5" key={section.day}>
                    <h3 className="text-xs font-extrabold text-purple-600 uppercase tracking-widest border-l-2 border-purple-500 pl-2 mb-3">{section.day}</h3>
                    {section.items.map((item) => (
                      <div className="p-4 bg-[#f8f9fb] border border-gray-100 rounded-[1.25rem] flex flex-col gap-2" key={item._id}>
                        <div className="flex justify-between items-center">
                          <div>
                            <strong className="text-sm font-bold text-gray-800 block">{item.groupName}</strong>
                            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">{item.instrument}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-gray-600 block">{item.startTime} - {item.endTime}</span>
                            <span className="text-[10px] text-gray-400 font-bold block mt-0.5 uppercase tracking-wider">{item.room || "Room not set"}</span>
                          </div>
                        </div>
                        {item.notes ? (
                          <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic bg-white p-2 rounded-[0.75rem] border border-gray-50">
                            "{item.notes}"
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

      </div>

      {/* Reassignment Modal */}
      {showReassignModal && selectedStudentForReassign && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 shadow-lg">
            <div className="mb-6">
              <p className="text-[11px] font-bold text-purple-500 uppercase tracking-widest mb-2">Reassign Student</p>
              <h2 className="text-xl font-extrabold text-gray-900">
                Move {selectedStudentForReassign.user?.name || "Student"} to a different group
              </h2>
              <p className="text-xs text-gray-500 mt-2">
                Currently in: <span className="font-bold text-gray-700">{selectedStudentForReassign.currentGroupName}</span>
              </p>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 rounded-[1rem] text-xs font-bold mb-4">{error}</div>}

            <div className="mb-6">
              <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-3">
                Select Target Group
              </label>
              <select
                value={selectedNewGroupId}
                onChange={(e) => setSelectedNewGroupId(e.target.value)}
                className="w-full p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold focus:outline-none focus:border-gray-200 cursor-pointer"
              >
                <option value="">Choose a group...</option>
                {(dashboard?.groups || [])
                  .filter((group) => String(group._id) !== String(selectedStudentForReassign.group?._id || selectedStudentForReassign.group))
                  .map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.groupName} ({group.filled}/{group.capacity})
                      {group.filled >= group.capacity ? " - FULL" : ""}
                    </option>
                  ))}
              </select>
              {(dashboard?.groups || []).every((group) => String(group._id) === String(selectedStudentForReassign.group?._id || selectedStudentForReassign.group)) && (
                <p className="text-[10px] text-gray-400 mt-2">No other groups available for reassignment.</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReassignModal(false);
                  setSelectedStudentForReassign(null);
                  setSelectedNewGroupId("");
                  setError("");
                }}
                className="flex-1 py-3 border border-gray-100 bg-white hover:bg-gray-50 text-gray-700 rounded-[1rem] text-xs font-bold tracking-wider uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReassignStudent}
                disabled={!selectedNewGroupId || reassigningStudentId === selectedStudentForReassign._id}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-[1rem] text-xs font-bold tracking-wider uppercase transition-colors"
              >
                {reassigningStudentId === selectedStudentForReassign._id ? "Reassigning..." : "Reassign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
};

export default TeacherDashboard;
